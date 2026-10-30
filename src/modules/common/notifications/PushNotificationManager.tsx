import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from "@react-native-firebase/messaging";
import notifee, { EventType } from "@notifee/react-native";
import { useAuth } from "../auth/context/AuthContext";
import { isAppStackMounted, navigationRef } from "../../../navigation/navigationRef";
import {
  getRuntimeFirebaseProjectId,
  isFirebaseConfigured,
  isPrimaryFirebaseProject,
  maskToken,
} from "./pushConfig";
import { ensureNotificationChannels } from "./pushDisplay";
import { handleForegroundMessage, queueLocalOpen, queueRemoteOpen } from "./pushHandlers";
import {
  performNotificationOpen,
  setActivePushUser,
  subscribePendingOpen,
  takePendingOpen,
} from "./pushNavigation";
import { pushRegistrar } from "./pushRegistration";
import { notifyNotificationsChanged } from "./notificationEvents";

const warn = (label: string) => (error: unknown) =>
  __DEV__ && console.warn(`[Push] ${label}`, error);

// Single owner of every push listener in the app. Mounted once inside the
// NavigationContainer; screens must not register FCM/Notifee listeners.
export default function PushNotificationManager() {
  const { user, isAuthenticated, isInitializing, termsAccepted } = useAuth();
  const userId = isAuthenticated ? user?.user_id ?? null : null;
  const firebaseReady = isFirebaseConfigured();
  const initialChecked = useRef(false);

  useEffect(() => {
    ensureNotificationChannels().catch(warn("Channel setup failed"));

    if (__DEV__) {
      const projectId = getRuntimeFirebaseProjectId();
      console.log(`[Push] Firebase project: ${projectId ?? "not configured"}`);
      if (projectId && !isPrimaryFirebaseProject(projectId)) {
        console.warn("[Push] google-services.json is not the primary Firebase project");
      }
      // QA aid: proves token retrieval works before login. Masked; never the full token.
      if (projectId) {
        getToken(getMessaging())
          .then(token => console.log(`[Push] FCM token available: ${maskToken(token)}`))
          .catch(error => console.warn("[Push] FCM token unavailable", error?.message || error));
      }
    }
  }, []);

  // Register this device for the signed-in user; re-runs on account switch.
  useEffect(() => {
    setActivePushUser(userId);
    if (!firebaseReady || userId === null) {
      pushRegistrar.stop();
      return;
    }

    pushRegistrar.start(userId);
    const unsubscribeRefresh = onTokenRefresh(getMessaging(), token =>
      pushRegistrar.handleTokenRefresh(token),
    );
    return unsubscribeRefresh;
  }, [firebaseReady, userId]);

  useEffect(() => {
    if (!firebaseReady) return;
    const messaging = getMessaging();

    const unsubscribeForeground = onMessage(messaging, message => {
      handleForegroundMessage(message).catch(warn("Foreground display failed"));
    });
    const unsubscribeOpened = onNotificationOpenedApp(messaging, message => {
      queueRemoteOpen(message, "background");
    });
    // Background presses are handled by notifee.onBackgroundEvent in index.js.
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) queueLocalOpen(detail.notification, "foreground");
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
      unsubscribeNotifee();
    };
  }, [firebaseReady]);

  // Cold start from a tap: wait for session restore so the tap is attributed
  // to the right user (or to nobody) before it is queued.
  useEffect(() => {
    if (!firebaseReady || isInitializing || initialChecked.current) return;
    initialChecked.current = true;

    getInitialNotification(getMessaging())
      .then(message => queueRemoteOpen(message, "terminated"))
      .catch(warn("Initial FCM notification failed"));
    notifee
      .getInitialNotification()
      .then(initial => queueLocalOpen(initial?.notification, "terminated"))
      .catch(warn("Initial local notification failed"));
  }, [firebaseReady, isInitializing]);

  // Open queued taps once the authenticated App stack is actually mounted.
  const canOpen = !isInitializing && isAuthenticated && termsAccepted === true;
  useEffect(() => {
    if (!canOpen || userId === null) return;

    const tryOpen = () => {
      if (!isAppStackMounted()) return;
      const open = takePendingOpen(userId);
      if (open) performNotificationOpen(open);
    };

    tryOpen();
    const unsubscribePending = subscribePendingOpen(tryOpen);
    const unsubscribeState = navigationRef.addListener("state", tryOpen);
    return () => {
      unsubscribePending();
      unsubscribeState();
    };
  }, [canOpen, userId]);

  // Resume / reconnect: refresh the bell and recover a missed registration.
  useEffect(() => {
    if (userId === null) return;

    let wasConnected = true;
    const appStateSubscription = AppState.addEventListener("change", state => {
      if (state !== "active") return;
      notifyNotificationsChanged();
      pushRegistrar.revalidate();
    });
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const connected = Boolean(state.isConnected);
      if (connected && !wasConnected) pushRegistrar.retryIfPending();
      wasConnected = connected;
    });

    return () => {
      appStateSubscription.remove();
      unsubscribeNetInfo();
    };
  }, [userId]);

  return null;
}

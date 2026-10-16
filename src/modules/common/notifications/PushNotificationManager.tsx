import React, { useEffect, useMemo, useRef } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  type RemoteMessage,
} from "@react-native-firebase/messaging";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import { getApps } from "@react-native-firebase/app";
import { useNavigation } from "@react-navigation/native";
import api from "../auth/api/axios";
import { useAuth } from "../auth/context/AuthContext";

const CHANNEL_ID = "reward_planners_general";

const openNotificationCenter = (navigation: any) => {
  try {
    navigation.navigate("Notification");
  } catch (error) {
    __DEV__ && console.warn("[Push] Unable to open notification screen", error);
  }
};

const syncToken = async (token: string) => {
  if (!token) return;
  await api.post("/v1/auth/update-fcm-token", {
    fcm_token: token,
    device_platform: Platform.OS,
  });
};

const displayForegroundNotification = async (
  message: RemoteMessage,
) => {
  const title = message.notification?.title || message.data?.title || "Reward Planners";
  const body = message.notification?.body || message.data?.message || "You have a new notification";

  await notifee.displayNotification({
    title: String(title),
    body: String(body),
    data: message.data,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: { id: "default" },
      smallIcon: "ic_launcher",
    },
  });
};

export default function PushNotificationManager() {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<any>();
  const initialNotificationHandled = useRef(false);
  const firebaseMessaging = useMemo(
    () => (getApps().length > 0 ? getMessaging() : null),
    [],
  );

  useEffect(() => {
    notifee.createChannel({
      id: CHANNEL_ID,
      name: "General notifications",
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: "default",
    }).catch(error => __DEV__ && console.warn("[Push] Channel setup failed", error));

    if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
        .catch(error => __DEV__ && console.warn("[Push] Permission request failed", error));
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !firebaseMessaging) return;

    let active = true;
    registerDeviceForRemoteMessages(firebaseMessaging)
      .then(() => getToken(firebaseMessaging))
      .then(token => active && syncToken(token))
      .catch(error => __DEV__ && console.warn("[Push] Token registration failed", error));

    const unsubscribeRefresh = onTokenRefresh(firebaseMessaging, token => {
      syncToken(token).catch(error =>
        __DEV__ && console.warn("[Push] Token refresh sync failed", error),
      );
    });

    return () => {
      active = false;
      unsubscribeRefresh();
    };
  }, [firebaseMessaging, isAuthenticated]);

  useEffect(() => {
    if (!firebaseMessaging) return;

    const unsubscribeForeground = onMessage(firebaseMessaging, message => {
      displayForegroundNotification(message).catch(error =>
        __DEV__ && console.warn("[Push] Foreground display failed", error),
      );
    });

    const unsubscribeOpened = onNotificationOpenedApp(firebaseMessaging, () => {
      openNotificationCenter(navigation);
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.PRESS) openNotificationCenter(navigation);
    });

    if (!initialNotificationHandled.current) {
      initialNotificationHandled.current = true;
      getInitialNotification(firebaseMessaging).then(message => {
        if (message) setTimeout(() => openNotificationCenter(navigation), 250);
      });
      notifee.getInitialNotification().then(initial => {
        if (initial?.notification) {
          setTimeout(() => openNotificationCenter(navigation), 250);
        }
      });
    }

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
      unsubscribeNotifee();
    };
  }, [firebaseMessaging, navigation]);

  return null;
}

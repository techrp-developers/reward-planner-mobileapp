import React, { useEffect, useRef } from 'react';
import { AppState, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/modules/common/auth/context/AuthContext';
import { AlertProvider, AlertContainer } from './src/modules/ecommerce/components/alerts';
import { CartProvider } from './src/modules/ecommerce/context/CartContext';
import { NavigationContainer, LinkingOptions, NavigatorScreenParams, createNavigationContainerRef } from "@react-navigation/native";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/query/queryClient';
import { AppThemeProvider } from "./src/theme/ThemeContext";
import NetworkGuard from './src/modules/common/noInternet/NetworkGuard';

// Notification imports
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import {
  consumePendingNotificationPress,
  displayNotificationFromRemoteMessage,
  dismissTodoReminder,
  ensureNotificationChannels,
  requestUserPermission,
  snoozeTodoReminder,
  TODO_NOTIFICATION_ACTIONS,
} from './src/services/NotificationService';

export const navigationRef = createNavigationContainerRef<any>();

type AuthModalStackParamList = {
  Login: undefined;
  AccountActivate: undefined;
  OTPScreen: { email: string };
  SetNewPassword: { email: string };
  AccountActivationSuccess: undefined;
  VerifyEmail: { email: string };
};

type RootStackParamList = {
  SplashScreen: undefined;
  AuthStack: NavigatorScreenParams<AuthModalStackParamList>;
  AppStack: undefined;
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['rewardplanners://', 'rewardapp://'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          Login: 'login',
          AccountActivate: 'activate',
          OTPScreen: 'otp',
          SetNewPassword: 'set-password',
          AccountActivationSuccess: 'activation-success',
          VerifyEmail: 'verify-email',
        },
      },
    },
  },
};

export default function App() {
  const pendingNotificationRef = useRef<any | null>(null);

  const handleNotificationPress = (data: any) => {
    if (!data) return;
    console.log('=== HANDLING NOTIFICATION TAP ===');
    console.log(data);
    console.log('=================================');

    const module = data.module;
    const type = data.type;
    const screen = data.screen;
    const actionUrl = data.action_url;
    const referenceType = data.reference_type;
    const referenceId = data.reference_id;

    if (!navigationRef.isReady()) {
      pendingNotificationRef.current = data;
      console.warn('[FCM Redirect] Navigation is not ready yet. Queueing payload.');
      return;
    }

    setTimeout(async () => {
      try {
        if (actionUrl && (await Linking.canOpenURL(actionUrl))) {
          console.log(`[FCM Redirect] Opening action URL: ${actionUrl}`);
          await Linking.openURL(actionUrl);
          return;
        }

        const params =
          referenceType || referenceId
            ? { referenceType, referenceId }
            : undefined;

        if (module === 'todo' || type === 'todo_reminder' || screen === 'TodoList') {
          console.log('[FCM Redirect] Navigating to TodoList Screen...');
          navigationRef.navigate('TodoList', params);
        } else if (screen) {
          console.log(`[FCM Redirect] Navigating directly to custom screen: ${screen}...`);
          navigationRef.navigate(screen, params);
        } else if (
          module === 'service' ||
          module === 'ecommerce' ||
          module === 'bbps' ||
          module === 'cart' ||
          module === 'shipment' ||
          type === 'delivery' ||
          type?.includes('order') ||
          type?.includes('shipment') ||
          screen === 'Orders' ||
          screen === 'TrackOrders'
        ) {
          console.log('[FCM Redirect] Navigating to TrackOrders Screen...');
          navigationRef.navigate('TrackOrders', params);
        } else if (module === 'step_counter') {
          console.log('[FCM Redirect] Navigating to RewardStack...');
          navigationRef.navigate('RewardStack');
        } else if (module === 'wallet' || type === 'coins' || type?.includes('reward') || screen === 'WalletHistory') {
          console.log('[FCM Redirect] Navigating to WalletHistory Screen...');
          navigationRef.navigate('WalletHistory', params);
        } else {
          console.log('[FCM Redirect] Defaulting to Dashboard Screen...');
          navigationRef.navigate('Dashboard');
        }
      } catch (navError: any) {
        console.error('[FCM Redirect] Navigation failure:', navError.message);
      }
    }, 800);
  };

  useEffect(() => {
    const setupNotifications = async () => {
      await ensureNotificationChannels();
      await requestUserPermission();
    };

    setupNotifications();

    const consumeQueuedPress = async () => {
      const pendingPress = await consumePendingNotificationPress();
      if (pendingPress) {
        handleNotificationPress(pendingPress);
      }
    };

    consumeQueuedPress();

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        consumeQueuedPress();
      }
    });

    // 1. Foreground listener: Displays push notification when app is open
    const unsubscribeFCM = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in foreground:', remoteMessage);
      await displayNotificationFromRemoteMessage(remoteMessage);
    });

    // 2. Foreground Notifee Event Listener (triggers when user taps local banner)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction?.id === TODO_NOTIFICATION_ACTIONS.SNOOZE) {
          snoozeTodoReminder(detail.notification?.data as any);
          return;
        }

        if (detail.pressAction?.id === TODO_NOTIFICATION_ACTIONS.DISMISS) {
          dismissTodoReminder(detail.notification?.data as any);
          return;
        }
      }

      if (type === EventType.PRESS) {
        console.log('Notifee banner tapped in foreground:', detail);
        handleNotificationPress(detail.notification?.data);
      }
    });

    // 3. Background/Killed state: Check if app was opened from completely closed state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from killed state by notification:', remoteMessage);
          handleNotificationPress(remoteMessage.data);
        }
      });

    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification?.notification?.data) {
        console.log('App opened from killed state by local notification:', initialNotification);
        handleNotificationPress(initialNotification.notification.data);
      }
    });

    // 4. Background state listener: Triggered when user taps notification while app is running in background
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification tapped while app was in background:', remoteMessage);
      handleNotificationPress(remoteMessage.data);
    });

    return () => {
      appStateSubscription.remove();
      unsubscribeFCM();
      unsubscribeNotifee();
      unsubscribeNotificationOpened();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AlertProvider>
            <AuthProvider>
              <CartProvider>
                <NetworkGuard>
                  <NavigationContainer
                    ref={navigationRef}
                    linking={linking}
                    onReady={() => {
                      if (pendingNotificationRef.current) {
                        const queuedPayload = pendingNotificationRef.current;
                        pendingNotificationRef.current = null;
                        handleNotificationPress(queuedPayload);
                      }
                    }}
                  >
                    <AlertContainer />
                    <RootNavigator />
                  </NavigationContainer>
                </NetworkGuard>
              </CartProvider>
            </AuthProvider>
          </AlertProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

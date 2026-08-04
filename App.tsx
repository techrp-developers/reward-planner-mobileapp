import React, { useEffect } from 'react';
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
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { requestUserPermission } from './src/services/NotificationService';

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
  useEffect(() => {
    const setupNotifications = async () => {
      await requestUserPermission();
    };

    setupNotifications();

    // Helper function to handle deep-linking redirection based on FCM notification data payload
    const handleNotificationPress = (data: any) => {
      if (!data) return;
      console.log('=== HANDLING NOTIFICATION TAP ===');
      console.log(data);
      console.log('=================================');

      const module = data.module;
      const type = data.type;
      const screen = data.screen;

      // Small delay to ensure navigation state is ready
      setTimeout(() => {
        if (!navigationRef.isReady()) {
          console.warn('[FCM Redirect] Navigation is not ready yet.');
          return;
        }

        try {
          if (module === 'todo' || type === 'todo_reminder' || screen === 'TodoList') {
            console.log('[FCM Redirect] Navigating to TodoList Screen...');
            navigationRef.navigate('TodoList');
          } else if (
            module === 'ecommerce' ||
            module === 'service' ||
            type === 'delivery' ||
            type?.includes('order') ||
            screen === 'Orders'
          ) {
            console.log('[FCM Redirect] Navigating to Orders Screen...');
            navigationRef.navigate('Orders');
          } else if (module === 'wallet' || type === 'coins' || type?.includes('reward') || screen === 'WalletHistory') {
            console.log('[FCM Redirect] Navigating to WalletHistory Screen...');
            navigationRef.navigate('WalletHistory');
          } else if (screen) {
            console.log(`[FCM Redirect] Navigating directly to custom screen: ${screen}...`);
            navigationRef.navigate(screen);
          } else {
            console.log('[FCM Redirect] Defaulting to Dashboard Screen...');
            navigationRef.navigate('Dashboard');
          }
        } catch (navError: any) {
          console.error('[FCM Redirect] Navigation failure:', navError.message);
        }
      }, 800);
    };

    // 1. Foreground listener: Displays push notification when app is open
    const unsubscribeFCM = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in foreground:', remoteMessage);

      // Create a high-priority notification channel
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [0, 1000, 500, 1000, 500],
      });

      // Display the banner using Notifee
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Message',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data, // Forward payload data to Notifee notification
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' }, 
        },
      });
    });

    // 2. Foreground Notifee Event Listener (triggers when user taps local banner)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
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

    // 4. Background state listener: Triggered when user taps notification while app is running in background
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification tapped while app was in background:', remoteMessage);
      handleNotificationPress(remoteMessage.data);
    });

    return () => {
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
                  <NavigationContainer ref={navigationRef} linking={linking}>
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
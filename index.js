/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { enableFreeze, enableScreens } from 'react-native-screens';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { getApps } from '@react-native-firebase/app';
import notifee, { EventType } from '@notifee/react-native';
import {
  handleBackgroundMessage,
  queueLocalOpen,
} from './src/modules/common/notifications/pushHandlers';

// Registered once, outside React, as both libraries require. These handlers
// may run headless: they only display or queue, never navigate.
if (getApps().length > 0) {
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    // Android displays `notification` payloads itself; only data-only messages are shown here.
    await handleBackgroundMessage(remoteMessage).catch(error => {
      if (__DEV__) console.warn('[Push] Background display failed', error);
    });
  });
}

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) queueLocalOpen(detail.notification, 'background');
});

enableScreens(true);
enableFreeze(true);

AppRegistry.registerComponent(appName, () => App);

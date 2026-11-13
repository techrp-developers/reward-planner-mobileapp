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
import { TODO_ALARM_DISMISS_ACTION } from './src/modules/common/notifications/todoAlarms';

if (getApps().length > 0) {
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    // Notification payloads are displayed by Android while the app is in the
    // background. This handler keeps data-only messages available for future use.
    if (__DEV__) console.log('[Push] Background message:', remoteMessage.messageId);
  });
}

// Handles notification actions while the app is killed or in the background,
// e.g. "Dismiss" on a ringing todo alarm, which must stop the looping sound.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (
    type === EventType.ACTION_PRESS &&
    detail.pressAction?.id === TODO_ALARM_DISMISS_ACTION &&
    detail.notification?.id
  ) {
    await notifee.cancelNotification(detail.notification.id);
  }
});

enableScreens(true);
enableFreeze(true);

AppRegistry.registerComponent(appName, () => App);

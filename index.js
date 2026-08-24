/**
 * @format
 */

// Ensure gesture handler and Reanimated are initialized before other imports
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppRegistry } from 'react-native';
import { enableFreeze, enableScreens } from 'react-native-screens';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { getApps } from '@react-native-firebase/app';

if (getApps().length > 0) {
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    // Notification payloads are displayed by Android while the app is in the
    // background. This handler keeps data-only messages available for future use.
    if (__DEV__) console.log('[Push] Background message:', remoteMessage.messageId);
  });
}

enableScreens(true);
enableFreeze(true);

AppRegistry.registerComponent(appName, () => App);

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { enableFreeze, enableScreens } from 'react-native-screens';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundHandler } from './src/services/NotificationService'; // <-- ADD THIS


enableScreens(true);
enableFreeze(true);

// 👇 ADD THIS LINE (Must be called before registering the app component)
registerBackgroundHandler();


AppRegistry.registerComponent(appName, () => App);

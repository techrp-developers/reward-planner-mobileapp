/* global jest */
// Native modules are absent under Jest. Prefer each library's official mock;
// the small stubs below cover libraries that do not ship one. Individual test
// files can still override any of these with their own jest.mock().

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  // Missing from the official 4.x mock; AuthMotion reads it on the login screen.
  useReducedMotion: () => false,
}));

jest.mock('@react-native-firebase/app', () => ({
  getApps: () => [],
  getApp: jest.fn(() => ({ options: {} })),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(),
  getToken: jest.fn(() => Promise.resolve('')),
  onMessage: jest.fn(() => jest.fn()),
  onTokenRefresh: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  setBackgroundMessageHandler: jest.fn(),
}));
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(() => Promise.resolve('')),
    createChannels: jest.fn(() => Promise.resolve()),
    getChannels: jest.fn(() => Promise.resolve([])),
    displayNotification: jest.fn(() => Promise.resolve('')),
    getNotificationSettings: jest.fn(() => Promise.resolve({ authorizationStatus: 0 })),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
    cancelDisplayedNotifications: jest.fn(() => Promise.resolve()),
    openNotificationSettings: jest.fn(() => Promise.resolve()),
  },
  AndroidImportance: { NONE: 0, LOW: 2, DEFAULT: 3, HIGH: 4 },
  AndroidStyle: { BIGPICTURE: 0, BIGTEXT: 1 },
  AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
  EventType: { DISMISSED: 0, PRESS: 1 },
}));

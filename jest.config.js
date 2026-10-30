module.exports = {
  preset: 'react-native',
  // Backend suites use Node's built-in runner (`node --test`, see
  // src/server/package.json) and must not be collected by the mobile Jest run.
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/server/',
    '<rootDir>/src/modules/ecommerce/v1/tests/',
  ],
  modulePathIgnorePatterns: ['<rootDir>/src/server/'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  // These packages ship untranspiled ESM or require image assets at import time.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-firebase|@react-navigation|@notifee|react-native-.*|@d11)/)',
  ],
};

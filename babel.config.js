module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Must be listed last — react-native-reanimated v4 moved its worklet
  // transform — make sure the Reanimated plugin is last so worklets
  // are compiled correctly at build time.
  plugins: ['react-native-reanimated/plugin'],
};

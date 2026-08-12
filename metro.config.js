const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const exclusionList = require("metro-config/private/defaults/exclusionList").default;

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  // Watchman isn't installed on this machine; spawning a missing `watchman`
  // binary can hang on Windows instead of failing fast, which was causing
  // the file watcher to time out ("Failed to start watch mode."). Falling
  // back to Metro's built-in watcher avoids that hang. Remove this once
  // Watchman is installed for faster file-change detection.
  watcher: {
    useWatchman: false,
  },

  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },

  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== "svg"),
    sourceExts: [...new Set([...defaultConfig.resolver.sourceExts, "svg"])],
    blockList: exclusionList([
      /android\/\.gradle\/.*/,
      /android\/\.cxx\/.*/,
      /android\/(?:app\/)?build\/.*/,
      /ios\/build\/.*/,
      /ios\/Pods\/.*/,
    ]),

    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Keep local Android API access working after USB/adb reconnects.
require('./scripts/adb-reverse').watchReverse();

module.exports = mergeConfig(defaultConfig, {
  // Watchman isn't installed on this machine; spawning a missing `watchman`
  // binary can hang on Windows instead of failing fast, which was causing
  // the file watcher to time out ("Failed to start watch mode."). Falling
  // back to Metro's built-in watcher avoids that hang. Remove this once
  // Watchman is installed for faster file-change detection.
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },

  resolver: {
    useWatchman: false,
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== "svg"),
    sourceExts: [...new Set([...defaultConfig.resolver.sourceExts, "svg"])],
    // The crawler uses native paths; the fallback watcher normalizes to '/'.
    // Match both without exclusionList rewriting separators on Windows.
    blockList: [
      // The Express backend and its dependencies are not part of the mobile bundle.
      // Skip the directory itself so Metro does not crawl or watch its contents.
      /[/\\]src[/\\]server(?:[/\\].*)?$/,
      /[/\\]android[/\\](?:\.gradle|\.cxx|(?:app[/\\])?build)(?:[/\\].*)?$/,
      /[/\\]ios[/\\](?:build|Pods)(?:[/\\].*)?$/,
      /[/\\]__tests__(?:[/\\].*)?$/,
    ],

    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

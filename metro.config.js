const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const exclusionList = require("metro-config/private/defaults/exclusionList").default;

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
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

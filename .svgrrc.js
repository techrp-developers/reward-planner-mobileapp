module.exports = {
  // Generate compact SVG components explicitly, including banners over 500 KB.
  jsx: {
    babelConfig: {
      compact: true,
    },
  },
};

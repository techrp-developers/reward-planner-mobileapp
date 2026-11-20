module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['src/server/**/*.js', 'src/modules/ecommerce/v1/**/*.js'],
      env: {node: true, es2022: true},
      globals: {Response: 'readonly'},
    },
  ],
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 compiles worklets through react-native-worklets. Without
    // this plugin every 'worklet' directive is ignored and gestures fall back
    // to the JS thread, which shows up as dropped frames rather than an error.
    plugins: ['react-native-worklets/plugin'],
  };
};

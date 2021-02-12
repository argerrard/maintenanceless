module.exports = function(api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo", "module:metro-react-native-babel-preset"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          allowUndefined: true,
          moduleName: "@env",
          path: ".env",
          safe: false
        }
      ]
    ]
  };
};

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Configurações adicionais para resolver problemas de build
config.resolver.platforms = ["ios", "android", "native", "web"];

module.exports = withNativeWind(config, { 
  input: "./global.css",
  inlineRem: 16
});

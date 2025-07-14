// backend/craco.config.js
const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // find and remove the ModuleScopePlugin
      const idx = webpackConfig.resolve.plugins.findIndex(
        (p) => p.constructor.name === "ModuleScopePlugin"
      );
      if (idx >= 0) webpackConfig.resolve.plugins.splice(idx, 1);

      return webpackConfig;
    },
  },
};

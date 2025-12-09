/** @type {import('next').NextConfig} */

const path = require("path");

const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    config.resolve.conditionNames = ["import", "module", "browser", "default"];

    return config;
  },
  output: "standalone",
  transpilePackages: ["@lobehub/ui", "lodash-es"],
};

module.exports = nextConfig;

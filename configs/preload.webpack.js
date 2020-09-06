/* eslint @typescript-eslint/no-var-requires: 0 */

const { merge } = require("webpack-merge");

const baseConfig = require("./base.webpack");

module.exports = merge(baseConfig, {
    target: "electron-preload",
    entry: {
        preload: "./src/renderer/preload.ts",
    },
});

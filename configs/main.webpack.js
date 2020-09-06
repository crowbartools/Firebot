/* eslint @typescript-eslint/no-var-requires: 0 */

const { merge } = require("webpack-merge");

const baseConfig = require("./base.webpack");

module.exports = merge(baseConfig, {
    target: "electron-main",
    entry: {
        main: "./src/main/main.ts",
    },
});

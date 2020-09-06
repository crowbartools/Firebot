/* eslint @typescript-eslint/no-var-requires: 0 */

const path = require("path");
const { merge } = require("webpack-merge");
const spawn = require("child_process").spawn;

const baseConfig = require("./render.webpack");

module.exports = merge(baseConfig, {
    resolve: {
        alias: {
            "react-dom": "@hot-loader/react-dom",
        },
    },
    devServer: {
        contentBase: path.join(baseConfig.context, "../dist"),
        port: 2003,
        compress: true,
        noInfo: true,
        stats: "errors-only",
        inline: true,
        hot: true,
        headers: { "Access-Control-Allow-Origin": "*" },
        historyApiFallback: {
            verbose: true,
            disableDotRule: false,
        },
        after() {
            if (process.env.START_HOT) {
                console.log("Starting main process");
                spawn("npm", ["run", "start-main"], {
                    shell: true,
                    env: process.env,
                    stdio: "inherit",
                })
                    .on("close", (code) => process.exit(code))
                    .on("error", (spawnError) => console.error(spawnError));
            }
        },
    },
});

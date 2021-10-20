/* eslint @typescript-eslint/no-var-requires: 0 */

"use strict";

const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackHarddiskPlugin = require("html-webpack-harddisk-plugin");
const TailwindCSSPlugin = require("tailwindcss")("./configs/tailwind.js");

const { merge } = require("webpack-merge");

const baseConfig = require("./base.webpack");

module.exports = merge(baseConfig, {
    target: "web",
    entry: "./src/renderer/index.tsx",
    optimization: {
        moduleIds: 'named'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    { loader: "css-loader", options: { importLoaders: 1 } },
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions : {
                                plugins: [TailwindCSSPlugin],
                            },
                        },
                    },
                ],
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/,
                use: [
                    "file-loader",
                    {
                        loader: "image-webpack-loader",
                        options: {
                            disable: true,
                        },
                    },
                ],
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader",
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            title: "Firebot",
            alwaysWriteToDisk: true,
            template: path.join(baseConfig.context, "./src/renderer/index.html"),
        }),
        new HtmlWebpackHarddiskPlugin(),
    ],
});

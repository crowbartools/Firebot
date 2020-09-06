/* eslint @typescript-eslint/no-var-requires: 0 */

"use strict";

const path = require("path");

const { NamedModulesPlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackHarddiskPlugin = require("html-webpack-harddisk-plugin");
const TailwindCSSPlugin = require("tailwindcss")("./configs/tailwind.js");

const { merge } = require("webpack-merge");

const baseConfig = require("./base.webpack");

module.exports = merge(baseConfig, {
    target: "web",
    entry: "./src/renderer/index.tsx",
    module: {
        rules: [
            {
                test: /\.scss$/,
                loaders: ["style-loader", "css-loader", "sass-loader"],
            },
            {
                test: /\.css$/,
                loaders: [
                    "style-loader",
                    { loader: "css-loader", options: { importLoaders: 1 } },
                    {
                        loader: "postcss-loader",
                        options: {
                            ident: "postcss",
                            plugins: [TailwindCSSPlugin],
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
        new NamedModulesPlugin(),
        new HtmlWebpackPlugin({
            filename: "index.html",
            title: "Firebot",
            alwaysWriteToDisk: true,
            template: path.join(baseConfig.context, "./src/renderer/index.html"),
        }),
        new HtmlWebpackHarddiskPlugin(),
    ],
});

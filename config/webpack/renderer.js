const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const { merge, exclude } = require('./build.js');

module.exports = merge({
    // enable tsx suppport
    tsx: true,

    // relative to /src/
    dir: './renderer/',

    // relative to /src/<dir>/
    entry: './index.tsx',

    // electron-renderer assumes node integration. something we don't want
    target: 'web',

    resolve: {
        extensions: ['.tsx', '.html']
    },

    module: {
        rules: [
            {
                test: /\.css$/i,
                exclude,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            emit: true,
                            esModule: false
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: { importLoaders: 1 }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                config: path.resolve(__dirname, '../postcss/postcss.js')
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(gif|jpe?g|tiff|png|webp|bmp|svg|eot|ttf|woff|woff2)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[base]',
                }
            }
        ]
    },
    optimization: {
        minimizer: [new CssMinimizerPlugin()]
    },
    plugins:[
        new MiniCssExtractPlugin({ filename: 'css/[name].css'}),
        new HtmlWebpackPlugin({
            title: 'Firebot PlayGround',
            filename: "index.html",
            template: path.join(__dirname, "../../src/renderer/index.html")
        })
    ]
});
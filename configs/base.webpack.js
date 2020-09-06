/* eslint @typescript-eslint/no-var-requires: 0 */

'use strict';

const path = require('path');

const { DefinePlugin } = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const context = path.join(__dirname, '../');

module.exports = {
    mode,
    context,
    output: {
        path: path.join(context, './dist/'),
        filename: '[name].js'
    },
    node: {
        __dirname: false,
        __filename: false
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            exclude: /node_modules/,
            loader: 'ts-loader',
            options: {
                transpileOnly: true
            }
        }]
    },
    resolve: {
        plugins: [new TsconfigPathsPlugin()],
        extensions: ['.tsx', '.ts', '.js', '.json']
    },
    devtool: 'source-map',
    plugins: [
        new DefinePlugin({'process.env.NODE_ENV': JSON.stringify(mode)}),
        new ForkTsCheckerWebpackPlugin()
    ]
};
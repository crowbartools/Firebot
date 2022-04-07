const path = require('path');

const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ReactRefreshTypeScript = require('react-refresh-typescript');
const ESLintWebpackPlugin = require('eslint-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const mode = /^pro(?:d(?:uction)?)?$/i.test(process.env.NODE_ENV) ? 'production' : 'development';
const exclude = /(?:^|[\\\/])(?:(?:node_modules)|(?:config)|(?:\.vscode)|(?:dist)|(?:build))(?:[\\\/]|$)/i;

module.exports.exclude = exclude;
module.exports.merge = config => {
    const tsconfig = path.resolve(__dirname, '../../src/', config.dir, './tsconfig.json');

    let outputPath = path.resolve(__dirname, '../../build/', config.dir);
    let resolveExtensions = ['.js', '.ts'];
    if (config.resolve?.extensions) {
        resolveExtensions = resolveExtensions.concat(config.resolve.extensions);
    }

    const plugins = [
        new ForkTsCheckerWebpackPlugin({ typescript: { configFile: tsconfig } }),
        new ESLintWebpackPlugin({ quiet: true, failOnError: true })
    ];

    let devServer, getCustomTransformers;
    if (mode !== 'production' && config.tsx) {
        plugins.push(new ReactRefreshWebpackPlugin());
        devServer = {
            hot: true,
            static: {
                directory: path.resolve(__dirname, '../../build/static/')
            }
        };
        getCustomTransformers = () => ({
            before: [ReactRefreshTypeScript()]
        });
    }

    return {
        mode,
        entry: path.resolve(__dirname, '../../src/', config.dir, config.entry),
        output: {
            filename: 'index.js',
            path: outputPath
        },
        target: config.target,
        resolve: {
            extensions: resolveExtensions,
            plugins: [new TsconfigPathsPlugin({configFile: tsconfig})],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?/i,
                    exclude,
                    use: [
                        { loader: 'source-map-loader' },
                        {
                            loader: 'ts-loader',
                            options: {
                                configFile: tsconfig,
                                transpileOnly: true,
                                getCustomTransformers
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
                },
                ...(config.module?.rules ?? [])
            ]
        },
        plugins: [...plugins, ...(config.plugins ?? [])],
        optimization: config.optimization,
        devtool: 'source-map',
        devServer,
        stats: 'minimal'
    }
}
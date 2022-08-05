/*
grunt pack
    Removes the /dist/pack/ directory
    Runs electron packager for the current platform
    Copies Resources into /dist/pack/{platform}/resources/
*/

'use strict';
module.exports = function (grunt) {
    const { version } = grunt.file.readJSON('./node_modules/electron/package.json');

    const flags = [
        '--out="./dist/pack"',
        '--arch=x64',
        `--electronVersion=${version}`,
        '--asar.unpack="moderation-service.js"',
        '--prune',
        '--overwrite',
        '--version-string.ProductName="Firebot v5"',
        '--executable-name="Firebot v5"',
        '--icon="./build/gui/images/icon_transparent.ico"',
        '--ignore=/.github',
        '--ignore=/.vscode',
        '--ignore=/build/resources',
        '--ignore=/dist',
        '--ignore=/doc',
        '--ignore=/grunt',
        '--ignore=/src',
        '--ignore=/profiles'
    ].join(' ');

    grunt.config.merge({
        shell: {
            packwin64: {
                command: `npx --no-install --ignore-existing electron-packager . Firebot --platform=win32 ${flags}`
            },
            packlinux: {
                command: `npx --no-install --ignore-existing electron-packager . Firebot --platform=linux ${flags}`
            }
        }
    });

    const platform = grunt.config.get('platform');
    grunt.registerTask('pack', ['cleanup:pack', `shell:pack${platform}`, 'copy']);
};
/*
grunt compile
   Compiles a previously made pack into an installer(for windows) or tarball(for linux)
*/

'use strict';
const path = require('path');
module.exports = function (grunt) {

    const macPathIn = path.resolve(__dirname, `../dist/pack/Firebot-darwin-x64/Firebot.app`);
    const macPathOut = path.resolve(__dirname, '../dist/install/darwin');
    const macDmgIcon = path.resolve(__dirname, `../build/gui/images/logo_transparent_2.png`);
    const macDmgBg = path.resolve(__dirname, `../build/gui/images/firebot_dmg_bg.png`);
    const version = grunt.config('pkg').version;

    grunt.config.merge({
        'create-windows-installer': {
            win64: {
                appDirectory: path.join(__dirname, '../dist/pack/Firebot-win32-x64/'),
                outputDirectory: path.join(__dirname, '../dist/install/Windows/'),
                loadingGif: path.join(__dirname, '../build/gui/images/animated.gif'),
                iconUrl: path.join(__dirname, '../build/gui/images/icon_transparent.ico'),
                setupIcon: path.join(__dirname, '../build/gui/images/icon_transparent.ico'),
                exe: "Firebot v5.exe",
                title: "Firebot v5",
                name: "firebot",
                version: version,
                setupExe: `firebot-v${version}-setup.exe`,
                noMsi: true
            }
        },
        compress: {
            linux: {
                options: {
                    archive: path.join(__dirname, `../dist/install/Linux/firebot-v${version}-linux-x64.tar.gz`),
                    mode: 'tgz'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/pack/Firebot-linux-x64/',
                    src: ['**'],
                    dest: '/'
                }]
            }
        },
        shell: {
            'compile-darwin': {
                command: `npx --no-install electron-installer-dmg "${macPathIn}" firebot-v${version}-macos-x64 --out="${macPathOut}" --background="${macDmgBg}" --icon="${macDmgIcon}" --title="Firebot Installer" --debug`
            },
            'compile-rpm': {
                command: `npx --no-install electron-installer-redhat --src dist/pack/Firebot-linux-x64/ --dest dist/install/rpm/ --arch x86_64 --bin "Firebot v5"`
            },
            'compile-deb': {
                command: `npx --no-install electron-installer-debian --src dist/pack/Firebot-linux-x64/ --dest dist/install/deb/ --arch x86_64 --bin "Firebot v5"`
            }
        }
    });

    grunt.loadNpmTasks('grunt-electron-installer');
    grunt.loadNpmTasks('grunt-contrib-compress');
    let compileCommands = ['cleanup:install'];
    switch (grunt.config.get('platform')) {
        case 'win64':
            compileCommands.push('create-windows-installer:win64');
            break;

        case 'linux':
            compileCommands.push('compress:linux');
            compileCommands.push('shell:compile-rpm');
            compileCommands.push('shell:compile-deb');
            break;

        case 'darwin':
            compileCommands.push('shell:compile-darwin');
            break;

        default:
            throw new Error('unknonw platform');
    }
    grunt.registerTask('compile', compileCommands);
};

/*
grunt compile
   Compiles a previously made pack into an installer(for windows) or tarball(for linux)
*/

'use strict';
const path = require('path');
const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller;

module.exports = function (grunt) {

    const macIntelPathIn = path.resolve(__dirname, `../dist/pack/Firebot-darwin-x64/Firebot.app`);
    const macArmPathIn = path.resolve(__dirname, `../dist/pack/Firebot-darwin-arm64/Firebot.app`);
    const macPathOut = path.resolve(__dirname, '../dist/install/darwin');
    const macDmgIcon = path.resolve(__dirname, `../build/gui/images/logo_transparent_2.png`);
    const macDmgBg = path.resolve(__dirname, `../build/gui/images/firebot_dmg_bg.png`);
    const version = grunt.config('pkg').version;

    // Bringing in from https://github.com/electron-archive/grunt-electron-installer/blob/master/tasks/index.js
    grunt.registerMultiTask('create-windows-installer', 'Create the Windows installer', function () {
        this.requiresConfig(`${this.name}.${this.target}.appDirectory`);

        const config = grunt.config(`${this.name}.${this.target}`);
        const done = this.async();
        createWindowsInstaller(config).then(done, done);
    });

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
            'compile-darwin-x64': {
                command: `npx --no-install electron-installer-dmg "${macIntelPathIn}" firebot-v${version}-macos-x64 --out="${macPathOut}" --background="${macDmgBg}" --icon="${macDmgIcon}" --title="Firebot Installer" --debug`
            },
            'compile-darwin-arm64': {
                command: `npx --no-install electron-installer-dmg "${macArmPathIn}" firebot-v${version}-macos-arm64 --out="${macPathOut}" --background="${macDmgBg}" --icon="${macDmgIcon}" --title="Firebot Installer" --debug`
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    let compileCommands = [];
    switch (grunt.config.get('platform')) {
        case 'win64':
            compileCommands = ['create-windows-installer:win64'];
            break;

        case 'linux':
            compileCommands = ['compress:linux'];
            break;

        case 'darwin':
            compileCommands = ['shell:compile-darwin-x64', 'shell:compile-darwin-arm64'];
            break;

        default:
            throw new Error('unknown platform');
    }
    grunt.registerTask('compile', ['cleanup:install', ...compileCommands]);
};
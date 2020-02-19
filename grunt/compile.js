'use strict';

const path = require('path');
module.exports = function (grunt) {
    grunt.config.merge({
        'create-windows-installer': {
            win64: {
                appDirectory: path.join(__dirname, '../dist/pack/Firebot-win32-x64/'),
                outputDirectory: path.join(__dirname, '../dist/install/win64/'),
                loadingGif: path.join(__dirname, '../gui/images/animated.gif'),
                iconUrl: path.join(__dirname, '../gui/images/icon_transparent.ico'),
                setupIcon: path.join(__dirname, '../gui/images/icon_transparent.ico'),
                exe: "Firebot v5.exe",
                title: " Firebot v5",
                setupExe: "FirebotV5Setup.exe",
                noMsi: true
            }
        },
        compress: {
            linux64: {
                options: {
                    archive: path.join(__dirname, '../dist/install/linux64/Firebot-linux-x64.tar.gz'),
                    mode: 'tgz'
                },
                files: [{expand: true, dest: '/', src: ['**'], cmd: path.join(__dirname, '../dist/pack/Firebot-linux-x64')}]
            }
        }
    });

    grunt.loadNpmTasks('grunt-electron-installer');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('compile', function (scope) {
        scope = scope || grunt.option('platform') || 'win64';

        if (scope === 'win64') {
            grunt.task.run('pack', 'create-windows-installer:win64');

        } else if (scope === 'linux64') {
            grunt.task.run('pack:linux64', 'compress:linux64');

        } else {
            grunt.task.fatal(new Error('invalid platform'), 1);
        }
    });
};
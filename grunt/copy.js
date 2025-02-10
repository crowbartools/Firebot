/*
grunt copy
    - Removes previous resource copies
    - Copies resources into /dist/pack/{platform}/resources/
*/

'use strict';
const fs = require('fs');
const path = require('path');

function remFiles(scope) {
    const dir = path.join(__dirname, `../dist/pack/Firebot-${scope}-x64/resources/`);

    fs.rmSync(path.join(dir, './overlay/'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './overlay.html'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './firebot-setup-file-icon.ico'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './kbm-java/'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './ffmpeg/'), { recursive: true, force: true });
}

module.exports = function (grunt) {
    grunt.config.merge({
        xcopy: {

            src: {
                files: [
                    {
                        expand: true,
                        dest: 'build/',
                        cwd: 'src/',
                        src: [
                            '**',
                            '!secrets.template.json',
                            '!**/*.ts',
                            '!**/*.js',
                            '**/*.min.js',
                            '!**/*.scss'
                        ],
                        filter: 'isFile'
                    }
                ]
            },

            win64: {
                files: [
                    {
                        expand: true,
                        dest: 'dist/pack/Firebot-win32-x64/resources/',
                        cwd: 'build/resources/',
                        src: ['**'],
                        filter: 'isFile'
                    }
                ]
            },
            darwin: {
                files: [
                    {
                        expand: true,
                        dest: 'dist/pack/Firebot-darwin-x64/Firebot.app/Contents/Resources/resources/',
                        cwd: 'build/resources/',
                        src: ['**'],
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        dest: 'dist/pack/Firebot-darwin-arm64/Firebot.app/Contents/Resources/resources/',
                        cwd: 'build/resources/',
                        src: ['**'],
                        filter: 'isFile'
                    }
                ]
            },

            linux: {
                files: [
                    {
                        expand: true,
                        dest: 'dist/pack/Firebot-linux-x64/resources/',
                        cwd: 'build/resources/',
                        src: ['**'],
                        filter: 'isFile'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.task.renameTask('copy', 'xcopy');

    grunt.registerTask('copy', function () {
        const platform = grunt.config.get('platform');
        remFiles(platform);
        grunt.task.run(`xcopy:${platform}`);
    });

    grunt.registerTask('copysrc', function() {
        grunt.task.run('xcopy:src');
    });
};
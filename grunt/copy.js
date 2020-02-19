/* Registers copy functionality

grunt copy
    - Removes previous copies of resources
    - Copies resources into /dist/pack/{platform} (defaults to win64)

grunt copy:win64
grunt copy:linux64
    - Copies platform-specific resources to /dist/pack/{platform}

grunt copy:all
    - Copies resources to each /dist/pack/ platform directory
*/

'use strict';
const fs = require('fs-extra');
const path = require('path');

function remFiles(scope) {
    let dir = path.join(__dirname, `../dist/pack/Firebot-${scope === 'linux64' ? 'linux' : 'win32'}-x64/resources/`);

    fs.remove(path.join(dir, './overlay/'));
    fs.remove(path.join(dir, './overlay.html'));
    fs.remove(path.join(dir, './kbm-java/'));
    fs.remove(path.join(dir, './ffmpeg/'));
}

module.exports = function (grunt) {
    let platform = grunt.config.get('platform');

    grunt.config.merge({
        xcopy: {
            win64: {
                files: [
                    {expand: true, dest: 'dist/pack/Firebot-win32-x64/', src: ['resources/overlay/**', '!resources/overlay/scss/**']},
                    {expand: true, dest: 'dist/pack/Firebot-win32-x64/', src: ['resources/overlay.html']},
                    {expand: true, dest: 'dist/pack/Firebot-win32-x64/', src: ['resources/kbm-java/**']},
                    {expand: true, dest: 'dist/pack/Firebot-win32-x64/', src: ['resources/ffmpeg/**']}
                ]
            },
            linux64: {
                files: [
                    {expand: true, dest: 'dist/pack/Firebot-linux-x64/', src: ['resources/overlay/**', '!resources/overlay/scss/**']},
                    {expand: true, dest: 'dist/pack/Firebot-linux-x64/', src: ['resources/overlay.html']},
                    {expand: true, dest: 'dist/pack/Firebot-linux-x64/', src: ['resources/kbm-java/**']},
                    {expand: true, dest: 'dist/pack/Firebot-linux-x64/', src: ['resources/ffmpeg/**']}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.task.renameTask('copy', 'xcopy');

    grunt.registerTask('copy', function (scope) {
        if (scope == null || scope === '') {
            remFiles(platform);
            grunt.task.run(`xcopy:${platform}`);

        } else if (scope === 'win64' || scope === 'linux64') {
            remFiles(scope);
            grunt.task.run(`xcopy:${scope}`);

        } else if (scope === 'all') {
            remFiles('win64');
            remFiles('linux64');
            grunt.task.run('xcopy:win64', 'xcopy:linux64');

        } else {
            grunt.fail.fatal(new Error('unknown platform'), 1);
        }
    });
};
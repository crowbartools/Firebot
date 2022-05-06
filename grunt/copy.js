/*
grunt copy
    - Removes previous resource copies
    - Copies resources into /dist/pack/{platform}/resources/
*/

'use strict';
const fs = require('fs-extra');
const path = require('path');

function remFiles(scope) {
    const dir = path.join(__dirname, `../dist/pack/Firebot-${scope}-x64/resources/`);

    fs.removeSync(path.join(dir, './overlay/'));
    fs.removeSync(path.join(dir, './overlay.html'));
    fs.removeSync(path.join(dir, './firebot-setup-file-icon.ico'));
    fs.removeSync(path.join(dir, './kbm-java/'));
    fs.removeSync(path.join(dir, './ffmpeg/'));
}

module.exports = function (grunt) {
    grunt.config.merge({
        xcopy: {
            win64: {
                files: [
                    {expand: true, dest: 'dist/pack/Firebot-win32-x64/', src: ['resources/overlay/**', '!resources/overlay/scss/**']},
                    {expand: true, dest: 'dist/pack/Firebot-win32-x64/', src: ['resources/overlay.html']},
                    {expand: true, dest: 'dist/pack/Firebot-win32-x64/', src: ['resources/firebot-setup-file-icon.ico']},
                    {expand: true, dest: 'dist/pack/Firebot-win32-x64/', src: ['resources/kbm-java/**']},
                    {expand: true, dest: 'dist/pack/Firebot-win32-x64/', src: ['resources/ffmpeg/**']}
                ]
            },
            linux: {
                files: [
                    {expand: true, dest: 'dist/pack/Firebot-linux-x64/', src: ['resources/overlay/**', '!resources/overlay/scss/**']},
                    {expand: true, dest: 'dist/pack/Firebot-linux-x64/', src: ['resources/overlay.html']},
                    {expand: true, dest: 'dist/pack/Firebot-linux-x64/', src: ['resources/kbm-java/**']},
                    {expand: true, dest: 'dist/pack/Firebot-linux-x64/', src: ['resources/ffmpeg/**']}
                ]
            },
            darwin: {
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

    grunt.registerTask('copy', function () {
        const platform = grunt.config.get('platform');
        remFiles(platform);
        grunt.task.run(`xcopy:${platform}`);
    });
};
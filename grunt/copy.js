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
module.exports = function (grunt) {
    let platform = grunt.config.get('platform');

    grunt.config.merge({
        xcopy: {
            win64: {
                files: [
                    {expand: true, dest: 'dist/pack/win64/', src: ['resources/overlay/**', '!resources/overlay/scss/**']},
                    {expand: true, dest: 'dist/pack/win64/', src: ['resources/overlay.html']},
                    {expand: true, dest: 'dist/pack/win64/', src: ['resources/kbm-java/**']},
                    {expand: true, dest: 'dist/pack/win64/', src: ['resources/ffmpeg/**']}
                ]
            },
            linux64: {
                files: [
                    {expand: true, dest: 'dist/pack/linux64/', src: ['resources/overlay/**', '!resources/overlay/scss/**']},
                    {expand: true, dest: 'dist/pack/linux64/', src: ['resources/overlay.html']},
                    {expand: true, dest: 'dist/pack/linux64/', src: ['resources/kbm-java/**']},
                    {expand: true, dest: 'dist/pack/linux64/', src: ['resources/ffmpeg/**']}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.task.renameTask('copy', 'xcopy');

    grunt.registerTask('copy', function (scope) {
        if (scope == null || scope === '') {
            fs.removeSync(path.join(__dirname, `../dist/pack/${platform}/resources`));
            grunt.task.run(`xcopy:${platform}`);

        } else if (scope === 'win64' || scope === 'linux64') {
            fs.removeSync(path.join(__dirname, `../dist/pack/${scope}/resources`));
            grunt.task.run(`xcopy:${scope}`);

        } else if (scope === 'all') {
            fs.removeSync(path.join(__dirname, `../dist/pack/win64/resources`));
            fs.removeSync(path.join(__dirname, `../dist/pack/linux64/resources`));
            grunt.task.run('xcopy:win64', 'xcopy:linux64');

        } else {
            grunt.fail.fatal(new Error('unknown platform'), 1);
        }
    });
};
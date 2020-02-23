/*
grunt scss
    Removes previously compiled css
    Compiles gui and overlay dirs' scss into css
*/

'use strict';
module.exports = function (grunt) {
    grunt.config.merge({
        sass: {
            options: {
                sourceMap: false,
                implementation: require('node-sass')
            },
            gui: {
                files: [{
                    expand: true,
                    cwd: 'gui/scss/',
                    src: ['*.scss'],
                    dest: 'gui/css/',
                    ext: '.css'
                }]
            },
            overlay: {
                files: [{
                    expand: true,
                    cwd: 'resources/overlay/scss/',
                    src: ['*.scss'],
                    dest: 'resources/overlay/css/',
                    ext: '.css'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-sass');
    grunt.registerTask('scss', ['cleanup:css', 'sass']);
};
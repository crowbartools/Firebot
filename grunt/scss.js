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
                implementation: require('sass')
            },
            gui: {
                files: [{
                    expand: true,
                    cwd: 'src/gui/scss/',
                    src: ['*.scss'],
                    dest: 'build/gui/css/',
                    ext: '.css'
                }]
            },
            overlay: {
                files: [{
                    expand: true,
                    cwd: 'src/resources/overlay/scss/',
                    src: ['*.scss'],
                    dest: 'build/resources/overlay/css/',
                    ext: '.css'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-sass');
    grunt.registerTask('scss', ['cleanup:css', 'sass']);
};
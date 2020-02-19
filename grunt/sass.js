/*
Registers sass/scss related functionality for grunt:

grunt scss
    Compiles both the gui and overlay dirs' scss into css

grunt scss:gui
    Compiles the gui dir's scss into css

grunt scss:overlay
    Compiles the overlay dir's scss into css
*/

'use strict';

const sass = require('node-sass');

module.exports = function (grunt) {
    grunt.config.merge({
        sass: {
            options: {
                sourceMap: false,
                implementation: sass
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

    grunt.registerTask('scss', function (targ) {
        if (targ == null) {
            grunt.task.run('sass');

        } else if (targ === 'gui') {
            grunt.task.run('sass:gui');

        } else if (targ === 'overlay') {
            grunt.task.run('sass:overlay');

        } else {
            grunt.fail.fatal(new Error('Unknown sass target'), 1);
        }
    });
};
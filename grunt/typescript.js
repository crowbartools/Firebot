"use strict";

module.exports = function (grunt) {
    grunt.config.merge({
        shell: {
            tsc: {
                command: 'tsc'
            }
        }
    });
    grunt.registerTask('tsc', ['shell:tsc']);
};
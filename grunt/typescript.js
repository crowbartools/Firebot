"use strict";

module.exports = function (grunt) {
    grunt.config.merge({
        shell: {
            tsc: {
                command: 'tsc --build'
            }
        }
    });
    grunt.registerTask('tsc', ['shell:tsc']);
};
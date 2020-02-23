/*
grunt lint
    lints the project, only outputting errors
*/

'use strict';
module.exports = function (grunt) {
    grunt.config.merge({
        shell: {
            eslint: {
                command: 'npx --no-install eslint . --quiet'
            }
        }
    });

    grunt.registerTask('lint', ['shell:eslint']);
};
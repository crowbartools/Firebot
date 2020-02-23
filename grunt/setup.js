"use strict";

module.exports = function (grunt) {
    grunt.config.merge({
        shell: {
            setup: {
                command: 'npm run setup'
            }
        }
    });
    grunt.registerTask('setup', ['shell:setup']);
};
/* Registers linting functionality

grunt lint
    eslints the project, only outputting errors

grunt lint:fix
    eslints the project with the fix flag, only outputting errors

grunt lint:local
    eslitns the project, outputting errors and warnings to eslint.log.htm
*/

'use strict';
module.exports = function (grunt) {
    grunt.config.merge({
        shell: {
            eslint: {
                command: 'npx eslint . --quiet'
            },
            eslintfix: {
                command: 'npx eslint . --quiet --fix'
            },
            eslintlocal: {
                command: 'npx eslint . --output-file=eslint.log.htm --format=html --fix'
            }
        }
    });

    grunt.registerTask('lint', function (type) {
        if (type == null || type === '') {
            grunt.task.run('shell:eslint');

        } else if (type === 'fix') {
            grunt.task.run('shell:eslintfix');

        } else if (type === 'local') {
            grunt.task.run('shell:eslintlocal');

        } else {
            grunt.fail.fatal(new Error('Unknown lint enviornment'), 1);
        }
    });
};
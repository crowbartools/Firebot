/* Registers cleanup handlers
grunt cleanup
    - Removes /gui/css/
    - Removes /resources/overlay/css/
    - Empties /dist/

grunt cleanup:scss
    - Removes /gui/css/
    - Removes /resources/overlay/css/

grunt cleanup:dist
    - Empties /dist/

grunt cleanup:pack
    - Removes /dist/pack/

grunt cleanup:install
    - Removes /dist/install/
*/

'use strict';
const path = require('path');
const fs = require('fs-extra');
module.exports = function (grunt) {
    grunt.registerTask('cleanup', function (area) {

        // Removes compiled css directories
        // Removes /dist/ directory
        if (area == null || area === '') {
            fs.removeSync(path.join(__dirname, '../src/gui/css'));
            fs.removeSync(path.join(__dirname, '../src/resources/overlay/css'));
            fs.removeSync(path.join(__dirname, '../dist'));

        // Removes compiled css directories
        } else if (area === 'css') {
            fs.removeSync(path.join(__dirname, '../src/gui/css'));
            fs.removeSync(path.join(__dirname, '../src/resources/overlay/css'));

        // Removes /dist/
        } else if (area === 'dist') {
            fs.removeSync(path.join(__dirname, '../dist'));

        // Removes /dist/pack/
        } else if (area === 'pack') {
            fs.removeSync(path.join(__dirname, '../dist/pack'));

        // Removes /dist/install/
        } else if (area === 'install') {
            fs.removeSync(path.join(__dirname, '../dist/install'));

        // Remove /build
        } else if (area === 'build') {
            fs.removeSync(path.join(__dirname, '../build'));

        } else {
            grunt.fail.fatal(new Error('unknown cleanup property'), 1);
        }
    });
};
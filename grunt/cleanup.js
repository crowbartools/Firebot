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
const fs = require('fs');
module.exports = function (grunt) {
    grunt.registerTask('cleanup', function (area) {

        // Removes /dist/ directory
        // Removes /build/ directory
        if (area == null || area === '') {
            fs.rmSync(path.join(__dirname, '../dist'), { recursive: true, force: true });
            fs.rmSync(path.join(__dirname, '../build'), { recursive: true, force: true });

        // Removes compiled css directories
        } else if (area === 'css') {
            fs.rmSync(path.join(__dirname, '../build/gui/css'), { recursive: true, force: true });
            fs.rmSync(path.join(__dirname, '../build/resources/overlay/css'), { recursive: true, force: true });

        // Removes /dist/
        } else if (area === 'dist') {
            fs.rmSync(path.join(__dirname, '../dist'), { recursive: true, force: true });

        // Removes /dist/pack/
        } else if (area === 'pack') {
            fs.rmSync(path.join(__dirname, '../dist/pack'), { recursive: true, force: true });

        // Removes /dist/install/
        } else if (area === 'install') {
            fs.rmSync(path.join(__dirname, '../dist/install'), { recursive: true, force: true });

        // Remove /build
        } else if (area === 'build') {
            fs.rmSync(path.join(__dirname, '../build'), { recursive: true, force: true });

        } else {
            grunt.fail.fatal(new Error('unknown cleanup property'), 1);
        }
    });
};
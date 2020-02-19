/* Registers cleanup handlers
grunt cleanup
    - Deletes /gui/css/
    - Deletes /resources/overlay/css/
    - Empties /dist/

grunt cleanup:scss
grunt cleanup:scss:gui
grunt cleanup:scss:overlay
    - Deletes compiled css directories

grunt cleanup:pack
grunt cleanup:pack:win64
grunt cleanup:pack:linux64
    - Empties /dist/pack directories

grunt cleanup:install
grunt cleanup:install:win64
grunt cleanup:install:linux64
    - Empties /dist/install/ directories

grunt cleanup:win64
grunt cleanup:linux64
    - Removes /dist/pack/{platform} directory
    - Removes /dist/install/{platform} directory
*/

'use strict';
const path = require('path');
const fs = require('fs-extra');
module.exports = function (grunt) {
    grunt.registerTask('cleanup', function (area, scope) {

        // Removes compiled scss to css directories
        // Empties the distribution directory
        if (area == null || area === '') {
            fs.removeSync(path.join(__dirname, '../gui/css'));
            fs.removeSync(path.join(__dirname, '../resources/overlay/css'));
            fs.emptyDirSync(path.join(__dirname, '../dist/'));

        // Removes compiled scss to css directories
        } else if (area === 'scss') {
            if (scope == null || scope === '') {
                fs.removeSync(path.join(__dirname, '../gui/css'));
                fs.removeSync(path.join(__dirname, '../resources/overlay/css'));

            } else if (scope === 'gui') {
                fs.removeSync(path.join(__dirname, '../gui/css'));

            } else if (scope === 'overlay') {
                fs.removeSync(path.join(__dirname, '../resources/overlay/css'));

            } else {
                grunt.fail.fatal(new Error('unknown scss directory to clean'), 1);
            }

        // Removes the /dist/pack/ directories
        } else if (area === 'pack') {
            if (scope == null || scope === '') {
                fs.removeSync(path.join(__dirname, '../dist/pack/'));

            } else if (scope === 'win64') {
                fs.removeSync(path.join(__dirname, `../dist/pack/Firebot-win32-x64/`));

            } else if (scope === 'linux64') {
                fs.removeSync(path.join(__dirname, `../dist/pack/Firebot-linux-x64/`));

            } else {
                grunt.fail.fatal(new Error('unknown pack to clean'), 1);
            }

        // Empties /dist/install directories
        } else if (area === 'install') {
            if (scope == null || scope === '') {
                fs.removeSync(path.join(__dirname, '../dist/install/'));

            } else if (scope === 'win64' || scope === 'linux64') {
                fs.removeSync(path.join(__dirname, `../dist/install/${scope}/`));

            } else {
                grunt.fail.fatal(new Error('Invalid install to clean'), 1);
            }
        } else if (area === 'win64') {
            fs.removeSync(path.join(__dirname, `../dist/pack/Firebot-win32-x64/`));
            fs.removeSync(path.join(__dirname, `../dist/install/win32/`));

        // Empties platform-specific directories
        } else if (area === 'linux64') {
            fs.removeSync(path.join(__dirname, `../dist/pack/Firebot-linux-x64/`));
            fs.removeSync(path.join(__dirname, `../dist/install/linux/`));

        } else {
            grunt.fail.fatal(new Error('unknown cleanup property'), 1);
        }
    });
};
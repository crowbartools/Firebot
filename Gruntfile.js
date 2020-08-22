/*
All registered tasks accept a platform flag to override the default os platform
  Example: grunt pack --platform=linux

Registered Tasks:
    setup - runs npm install, npm rebuild, and rebuild for robotjs

    cleanup         - Deletes compiled CSS, and empties /dist/
    cleanup:css     - Deletes compiled CSS
    cleanup:pack    - Deletes /dist/pack
    cleanup:install - Deletes /dist/install
    cleanup:dist    - Empties /dist/

    scss - Deletes compiled CSS, then recompiles SCSS

    lint - Runs eslint

    pack
        - Runs electron-packager for the platform
        - Copies resources into the pack's resource folder

    compile - Creates an installer/tarball from the platform's pack

    build - Runs cleanup, scss, pack, and compile
*/

module.exports = function(grunt) {

    // Deduce platform
    let platform = grunt.option('platform');
    if (platform == null || platform == '' || platform instanceof Boolean) {
        platform = process.platform === 'win32' ? 'win64' : process.platform;
    }
    if (platform !== 'win64' && platform !== 'linux') {
        //grunt.fail.fatal(new Error('Platform not supported'), 1);
    }

    // Base configuration
    grunt.initConfig({
        platform: platform,
        pkg: grunt.file.readJSON('package.json'),
    });

    // Register shell executor
    grunt.loadNpmTasks('grunt-shell');

    // Register project modules
    require('./grunt/cleanup.js')(grunt);
    require('./grunt/scss.js')(grunt);
    require('./grunt/lint.js')(grunt);
    require('./grunt/copy.js')(grunt);
    require('./grunt/pack.js')(grunt);
    require('./grunt/compile.js')(grunt);
    require('./grunt/setup.js')(grunt);

    grunt.registerTask('build', ['scss', 'pack', 'compile']);
};
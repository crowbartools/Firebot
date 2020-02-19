module.exports = function(grunt) {

    const PLATFORM = grunt.option('platform') || 'win64';
    if (PLATFORM !== 'win64' && PLATFORM !== 'linux64') {
        grunt.fail.fatal(new Error('Unknown Platform'), 1);
    }

    // Project configuration.
    grunt.initConfig({
        platform: PLATFORM,
        pkg: grunt.file.readJSON('package.json'),
    });

    // Register shell executor
    grunt.loadNpmTasks('grunt-shell');

    require('./grunt/cleanup.js')(grunt);
    require('./grunt/sass.js')(grunt);
    require('./grunt/lint.js')(grunt);
    require('./grunt/copy.js')(grunt);
    require('./grunt/pack.js')(grunt);
    require('./grunt/compile.js')(grunt);
};
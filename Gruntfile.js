module.exports = function(grunt) {


    const PLATFORM = grunt.option('platform') || 'win64';
    if (PLATFORM !== 'win64' && PLATFORM !== 'linux64') {
        grunt.fail.fatal(new Error('Unknown Platform'), 1);
    }

    const WORKING_DIR = process.cwd();

    // Project configuration.
    grunt.initConfig({
        platform: PLATFORM,
        pkg: grunt.file.readJSON('package.json'),
        'create-windows-installer': {
            x64: {
                appDirectory: WORKING_DIR + '/dist/Firebot-win32-x64',
                outputDirectory: WORKING_DIR + '/dist/installer64',
                loadingGif: WORKING_DIR + '/gui/images/animated.gif',
                iconUrl: WORKING_DIR + '/gui/images/icon_transparent.ico',
                setupIcon: WORKING_DIR + '/gui/images/icon_transparent.ico',
                exe: "Firebot V5.exe",
                title:" Firebot V5",
                setupExe: "FirebotV5Setup.exe",
                noMsi: true
            }
        }
    });

    // Register shell executor
    grunt.loadNpmTasks('grunt-shell');

    // Load installer builder.
    grunt.loadNpmTasks('grunt-electron-installer');

    require('./grunt/cleanup.js')(grunt);
    require('./grunt/sass.js')(grunt);
    require('./grunt/lint.js')(grunt);
};
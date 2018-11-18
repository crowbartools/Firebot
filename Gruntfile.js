module.exports = function(grunt) {

    const WORKING_DIR = process.cwd();

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'create-windows-installer': {
            x64: {
                appDirectory: WORKING_DIR + '/dist/Firebot-win32-x64',
                outputDirectory: WORKING_DIR + '/dist/installer64',
                loadingGif: WORKING_DIR + '/gui/images/animated.gif',
                iconUrl: 'https://crowbartools.com/projects/firebot/logo.ico',
                setupIcon: WORKING_DIR + '/gui/images/logo.ico'
            }
        }
    });

    // Load installer builder.
    grunt.loadNpmTasks('grunt-electron-installer');

};
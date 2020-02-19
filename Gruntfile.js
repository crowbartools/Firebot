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
                iconUrl: WORKING_DIR + '/gui/images/icon_transparent.ico',
                setupIcon: WORKING_DIR + '/gui/images/icon_transparent.ico',
                exe: "Firebot V5.exe",
                title:" Firebot V5",
                setupExe: "FirebotV5Setup.exe",
                noMsi: true
            }
        }
    });

    // Load installer builder.
    grunt.loadNpmTasks('grunt-electron-installer');

    require('./grunt/sass.js')(grunt);
};
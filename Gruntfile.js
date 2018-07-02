module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'create-windows-installer': {
            x64: {
                appDirectory: 'C:/Users/erik.bigler/Documents/GitHub/Firebot/dist/Firebot-win32-x64',
                outputDirectory: 'C:/Users/erik.bigler/Documents/GitHub/Firebot/dist/installer64',
                loadingGif: 'C:/Users/erik.bigler/Documents/GitHub/Firebot/gui/images/animated.gif',
                iconUrl: 'https://crowbartools.com/projects/firebot/logo.ico',
                setupIcon: 'C:/Users/erik.bigler/Documents/GitHub/Firebot/gui/images/logo.ico'
            }
        }
    });

    // Load installer builder.
    grunt.loadNpmTasks('grunt-electron-installer');

};
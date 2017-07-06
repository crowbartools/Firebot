module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'create-windows-installer': {
            x64: {
                appDirectory: 'C:/GitHub/Personal/firebot/dist/Firebot-win32-x64',
                outputDirectory: 'C:/GitHub/Personal/firebot/dist/installer64',
                authors: 'Firebots'
            }
        }
    });

    // Load installer builder.
    grunt.loadNpmTasks('grunt-electron-installer')

}
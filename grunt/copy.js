/*
grunt copy
    - Removes previous resource copies
    - Copies resources into /dist/pack/{platform}/resources/
*/

'use strict';
const fs = require('fs');
const path = require('path');

function remFiles(scope) {
    const dir = path.join(__dirname, `../dist/pack/Firebot-${scope}-x64/resources/`);

    fs.rmSync(path.join(dir, './overlay/'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './overlay.html'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './control-deck/'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './overlay-widget-components/'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './firebot-setup-file-icon.ico'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './kbm-java/'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, './ffmpeg/'), { recursive: true, force: true });
}

module.exports = function (grunt) {
    grunt.config.merge({
        xcopy: {

            src: {
                files: [
                    {
                        expand: true,
                        dest: 'build/',
                        cwd: 'src/',
                        src: [
                            '**',
                            '!secrets.template.json',
                            '!**/*.ts',
                            '!**/*.js',
                            '**/*.min.js',
                            'resources/overlay/lib/**/*.js',
                            '!**/*.scss',
                            '!**/*.vue',
                            // handled by vite build task
                            '!resources/control-deck/**'
                        ],
                        filter: 'isFile'
                    }
                ]
            },

            win64: {
                files: [
                    {
                        expand: true,
                        dest: 'dist/pack/Firebot-win32-x64/resources/',
                        cwd: 'build/resources/',
                        src: ['**'],
                        filter: 'isFile'
                    }
                ]
            },
            darwin: {
                files: [
                    {
                        expand: true,
                        dest: 'dist/pack/Firebot-darwin-arm64/Firebot.app/Contents/Resources/resources/',
                        cwd: 'build/resources/',
                        src: ['**'],
                        filter: 'isFile'
                    }
                ]
            },

            linux: {
                files: [
                    {
                        expand: true,
                        dest: 'dist/pack/Firebot-linux-x64/resources/',
                        cwd: 'build/resources/',
                        src: ['**'],
                        filter: 'isFile'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.task.renameTask('copy', 'xcopy');

    grunt.registerTask('copy-vcruntime', function() {
        const sysroot = process.env.SystemRoot || 'C:\\Windows';
        const src = path.join(sysroot, 'System32', 'VCRUNTIME140.dll');
        const dest = path.join(
            __dirname,
            '../dist/pack/Firebot-win32-x64/resources/app.asar.unpacked/node_modules/@tursodatabase/database-win32-x64-msvc/VCRUNTIME140.dll'
        );
        if (!fs.existsSync(src)) {
            grunt.fail.fatal(`VCRUNTIME140.dll not found at ${src}. Please install the Visual C++ Redistributable before building.`);
            return;
        }
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        grunt.log.ok(`Copied VCRUNTIME140.dll into turso unpacked dir`);
    });

    grunt.registerTask('copy', function () {
        const platform = grunt.config.get('platform');
        remFiles(platform);
        grunt.task.run(`xcopy:${platform}`);
        if (platform === 'win64') {
            grunt.task.run('copy-vcruntime');
        }
    });

    grunt.registerTask('copysrc', function() {
        grunt.task.run('xcopy:src');
    });
};
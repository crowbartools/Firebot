'use strict';
module.exports = function (grunt) {
    let base = [
        'electron-packager . Firebot',
        '--out=./dist/pack/',
        '--arch=x64',
        '--electronVersion=7.1.9',
        '--js-flags="--harmony"',
        '--asar.unpack="moderation-ervice.js"',
        '--prune',
        '--overwrite',
        '--version-string.ProductName="Firebot v5"',
        '--executable-name="Firebot v5"',
        '--icon="./gui/images/icon_transparent.ico"',
        '--ignore=/.github',
        '--ignore=/.vscode',
        '--ignore=/dist',
        '--ignore=/doc',
        '--ignore=/grunt',
        '--ignore=/profiles',
        '--ignore=/resources'
    ].join(' ');

    grunt.config.merge({
        shell: {
            packwin64: {
                command: `${base} --platform=win32`
            },
            packlinux64: {
                command: `${base} --platform=linux`
            }
        }
    });

    grunt.registerTask('pack', function () {
        let platform = grunt.config.get('platform');
        grunt.task.run([
            'shell:eslint',
            'cleanup:scss',
            `cleanup:${platform}`,
            'scss',
            `copy:${platform}`,
            `shell:pack${platform}`
        ]);
    });
};
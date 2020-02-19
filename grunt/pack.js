'use strict';
module.exports = function (grunt) {
    let flags = [
        '--out="./dist/pack"',
        '--arch=x64',
        '--electronVersion=7.1.9',
        '--js-flags="--harmony"',
        '--asar.unpack="moderation-service.js"',
        '--prune',
        '--overwrite',
        '--version-string.ProductName="Firebot V5"',
        '--executable-name="Firebot V5"',
        '--icon="./gui/images/icon_transparent.ico"',
        '--ignore=/.github',
        '--ignore=/.vscode',
        '--ignore=/grunt',
        '--ignore=/resources',
        '--ignore=/doc',
        '--ignore=/profiles'
    ].join(' ');

    grunt.config.merge({
        shell: {
            packwin64: {
                command: `npx electron-packager . Firebot --platform=win32 ${flags}`
            },
            packlinux64: {
                command: `npx electron-packager . Firebot --platform=linux ${flags}`
            }
        }
    });

    grunt.registerTask('pack', function (scope) {
        scope = scope || grunt.config.get('platform') || 'win64';

        if (scope === 'win64' || scope === 'linux64') {
            grunt.task.run([
                'shell:eslint',
                'cleanup:scss',
                `cleanup:${scope}`,
                'scss',
                `shell:pack${scope}`,
                `copy:${scope}`
            ]);
        }
    });
};
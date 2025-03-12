/*
grunt pack
    Removes the /dist/pack/ directory
    Runs electron packager for the current platform
    Copies Resources into /dist/pack/{platform}/resources/
*/
'use strict';

const formatIgnoreList = (ignoreList) => {
    return ignoreList.map((item) => {
        if (item.dotfiles) {
            return '--ignore="^[\\\\\\/]?\\.[^\\\\\\/]+$"';
        }
        if (item.dotdirs) {
            return '--ignore="^[\\\\\\/]?\\.[^\\\\\\/]+[\\\\\\/]"';
        }

        if (item.path == null) {
            throw new Error('invalid ignore path');
        }

        const escapedPath = item.path.replace(/[()[\]{}.?+*\\/^$]/, char => (`\\${char}`));

        return `--ignore="^[\\\\\\/]?${escapedPath}${item.isFile ? '$"' : '(?:$|[\\\\\\/])"'}`;
    });
};

module.exports = function (grunt) {
    const { version } = grunt.file.readJSON('./node_modules/electron/package.json');

    let ignoreFlags;
    try {
        ignoreFlags = formatIgnoreList([
            {dotfiles: true},
            {dotdirs: true},
            {path: 'build/resources'},
            {path: 'dist'},
            {path: 'doc'},
            {path: 'docs'},
            {path: 'grunt'},
            {path: 'profiles'},
            {path: 'src'},
            {path: 'Gruntfile.js', isFile: true},
            {path: 'package.lock', isFile: true},
            {path: 'README.md', isFile: true},
            {path: 'secrets.gpg', isFile: true},
            {path: 'tsconfig.json', isFile: true}
        ]);
    } catch (err) {
        grunt.fail.fatal(err);
        return;
    }

    const flags = [
        '--out="./dist/pack"',
        '--arch=x64',
        `--electronVersion=${version}`,
        '--prune',
        '--overwrite',
        '--version-string.ProductName="Firebot v5"',
        '--executable-name="Firebot v5"',
        '--icon="./build/gui/images/icon_transparent.ico"',
        '--protocol=firebot',
        '--protocol-name="Firebot"',
        ...ignoreFlags
    ].join(' ');

    const appPackageJson = grunt.file.readJSON('./package.json');

    // electron-packager doesn't like prerelease tags with dots in them for the Windows target
    // see: https://github.com/electron/packager/issues/1714
    const [appVersion, prereleaseTag] = appPackageJson.version.split('-');
    const windowsAppVersion = appVersion + (prereleaseTag ? `-${prereleaseTag.replace(/\./g, '')}` : '');

    grunt.config.merge({
        shell: {
            packwin64: {
                command: `npx --no-install @electron/packager . Firebot --platform=win32 ${flags} --app-version=${windowsAppVersion}`
            },
            packdarwin: {
                command: `npx --no-install @electron/packager . Firebot --platform=darwin ${flags} --arch=arm64 --extend-info="extra.plist" --extra-resource="./src/resources/firebot-setup-file-icon.icns"`
            },
            packlinux: {
                command: `npx --no-install @electron/packager . Firebot --platform=linux ${flags}`
            }
        }
    });

    const platform = grunt.config.get('platform');
    grunt.registerTask('pack', ['cleanup:pack', `shell:pack${platform}`, 'copy']);
};
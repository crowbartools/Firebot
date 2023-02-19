const { exec } = require('node:child_process');
const { cpSync: copyDir, rmSync: remDir } = require('node:fs');
const { join, parse,  resolve } = require('./path');
const { write, readPackage } = require('./json-file');

const ignore = {
    files: [
        '.env.local',
        '.eslintrc.js',
        '.eslintrc.json',
        'next-env.d.ts',
        'tsconfig.json'
    ],
    directories: [
        '.next',
        '.turbo',
        'src',
        'scripts'
    ]
}

const appsPath = resolve(__dirname, '../../../');
const rootPath = resolve(appsPath, '../');
const outPath = resolve(rootPath, './build/');


// Remove /build
console.info('[compile:electron] Removing past build/ directory')
remDir(outPath, { recursive: true, force: true });
console.info('[compile:electron] Removed past build/ directory');


// Copy /apps
['electron', 'backend', 'frontend']
    .forEach(app => {
        console.info(`[compile:electron] Copying /apps/${app}/ to /build/${app}/`);
        copyDir(
            join(appsPath, `${app}/dist/`),
            join(outPath, `${app}/dist/`),
            { recursive: true }
        );

        const package = readPackage(join(appsPath, app), true);
        write(join(outPath, `${app}/package.json`), package);
        console.info(`[compile:electron] Copied /apps/${app}/ to /build/${app}/`);
    });

// copy /config
copyDir(
    join(rootPath, 'config/'),
    join(outPath, 'config/'),
    { recursive: true }
);


// Copy /packages
console.info('[compile:electron] Copying entries in /packages/ to /build/packages');
const relativePathStart = join(rootPath, 'packages/').length;
const isWindows = process.platform === 'win32';
copyDir(
    join(rootPath, 'packages/'),
    join(outPath, 'packages/'),
    {
        recursive: true,
        filter: (subject, dest) => {

            // Fix: Node prefixing absolute win32 paths with \\?\
            if (isWindows && subject.startsWith('\\\\?\\')) {
                subject = subject.slice(4);
            }

            const subjectParts = parse(subject);

            // ignored file
            if (ignore.files.includes(subjectParts.name)) {
                return false;
            }

            // ignored directory
            const subjectDir = subject.slice(relativePathStart).split(/[\\\/]/g);
            if (
                subjectDir.length &&
                subjectDir[0] !== 'dest' &&
                subjectDir.some(value => ignore.directories.includes(value))
            ) {
                return false;
            }

            // package.json
            if (subjectParts.base === 'package.json') {
                const package = readPackage(subject, true);
                write(dest, package)
                return false;
            }

            // anything else
            return true;
        }
    }
);
console.info('[compile:electron] Copyied entries in /packages/ to /build/packages');


// Generate package.json
console.info('[compile:electron] Generating package.json');
const base = readPackage(join(appsPath, 'electron/package.json'), false);
base.main = './electron/dist/index.js';
base.workspaces = [
    'config/*',
    'electron/',
    'backend/',
    'frontend/',
    'packages/*'
];
write(join(outPath, 'package.json'), base);

// run npm install - done so electron packaging only packages non dev deps
console.log('[compile:electron] Running npm install')
exec('npm install', { cwd: outPath }, err => {
    if (err) {
        console.error('[compile:electron]', err);
    } else {
        console.log('[compile:electron] npm install complete')
    }
});
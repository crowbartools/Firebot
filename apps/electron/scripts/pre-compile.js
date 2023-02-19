const { cpSync: copyDir, rmSync: remDir, writeFileSync: write } = require('node:fs');
const { posix, win32 } = require('node:path');
const { exec } = require('node:child_process');


let isWindows, basename, baseJoin, normalize, parse, baseResolve;
if (process.platform === 'win32') {
    basename = win32.basename;
    baseJoin = win32.join;
    normalize = win32.normalize;
    parse = win32.parse;
    baseResolve = win32.resolve;
    isWindows = true;
} else {
    basename = posix.basename;
    baseJoin = posix.join;
    normalize = posix.normalize;
    parse = posix.parse;
    baseResolve = posix.resolve;
}
const join = (...args) => normalize(baseJoin(...args));
const resolve = (...args) => normalize(baseResolve(...args));


const appsPath = resolve(__dirname, '../../');
const outPath = resolve(appsPath, '../build/');

// remove build directory
console.info('[compile:electron] Removing past build directory')
remDir(outPath, { recursive: true, force: true });
console.info('[compile:electron] Removed past build directory');

// copy applicable apps/ to build/
[
    'electron',
    'backend',
    'frontend'
].forEach(name => {
    console.info(`[compile:electron] Copying /apps/${name}/ to /build/${name}/`);
    copyDir(
        join(appsPath, `${name}/dist/`),
        join(outPath, `${name}/dist/`),
        { recursive: true }
    );
    const package = require(join(appsPath, `${name}/package.json`));
    delete package.devDependencies;
    delete package.scripts;
    write(
        join(outPath, `${name}/package.json`),
        JSON.stringify(package, null, 4),
        'utf8'
    );
    console.info(`[compile:electron] Copied /apps/${name}/ to /build/${name}/`);
});

// copy packages/
(root => {
    console.info('[compile:electron] Copying entries in /packages/ to /build/packages');

    const relativeStart = (join(root, 'packages/')).length;
    copyDir(
        join(root, 'packages/'),
        join(root, 'build/packages/'),
        {
            recursive: true,
            filter: (srcPath, destPath) => {

                // dirty fix for node prefix path with \\?\ on windows machines
                if (isWindows && srcPath.startsWith('\\\\?\\')) {
                    srcPath = srcPath.slice(4);
                }

                // Ignore src and .turbo directories
                const srcSubDir = srcPath.slice(relativeStart).split(/[\\\/]/g)[1];
                if (srcSubDir === 'src' || srcSubDir === '.turbo') {
                    return false;
                }

                // Ignore dev-use config files
                const { base } = parse(srcPath);
                if (
                    base === 'tsconfig.json' ||
                    base === '.eslintrc.js' ||
                    base === '.eslintrc.json'
                ) {
                    return false;
                }

                // cleanup package.json
                if (base === 'package.json') {
                    const package = require(srcPath);
                    delete package.scripts;
                    delete package.devDependencies;
                    write(destPath, JSON.stringify(package, null, 4), 'utf8');
                    return false;
                }

                return true;
            }
        }
    )
    console.info('[compile:electron] Copyied entries in /packages/ to /build/packages');

})(resolve(appsPath, '../'));

// build package.json
console.info('[compile:electron] Generating package.json');
const package = require('../../../package.json');
package.main ='./electron/index.js';
package.workspaces = [
    './electron',
    './backend',
    './frontend',
    './packages'
];
delete package.devDependencies;
delete package.scripts;
write(
    join(outPath, `package.json`),
    JSON.stringify(package, null, 2),
    'utf8'
);
console.info('[compile:electron] Generated package.json');

// Done so electron packaging only packages non dev deps
console.log('[compile:electron] Running npm install')
const npm = exec('npm install', { cwd: outPath }, err => {
    if (err) {
        console.error('[compile:electron]', err);
    } else {
        console.log('[compile:electron] npm install complete')
    }
});
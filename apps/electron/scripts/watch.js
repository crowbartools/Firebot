const ChildProcess = require('node:child_process');
const { TscWatchClient } = require('tsc-watch/client');

const path = require('path');
const electronProjectDir = path.join(__dirname, '../');
const appsDir = path.join(electronProjectDir, '../');
const backendProjectDir = path.join(appsDir, '/backend/');

let procs = {}
const close = (name) => {
    const proc = procs[name];
    if (proc != null) {
        proc.removeAllListeners();
        proc.kill();
        proc[name] = null;
    }
}
const shutdown = (err) => {
    close('electronInstance');
    close('electronWatcher');
    close('backendWatcher');
    if (err != null) {
        console.log(err);
    }
    process.exit();
}
process.on('uncaughtException', shutdown);
process.on('exit', shutdown);

const startElectron = () => {
    close('electronInstance');
    procs.electronInstance = ChildProcess.spawn(
        `node`,
        [
            path.join(appsDir, '../node_modules/electron/cli.js'),
            path.join(electronProjectDir, './dist/main.js')
        ],
        {
            cwd: electronProjectDir,
            env: { NODE_ENV: 'development' },
            stdio: 'inherit'
        }
    );
    procs.on('close', shutdown);
};

const startElectronWatcher = () => {
    close('electronWatcher');

    const electronWatcher = procs.electronWatcher = new TscWatchClient();
    electronWatcher.on('started', () => {
        console.log('[electron] (Re)Compiling...');
    });
    electronWatcher.on('compile_errors', () => {
        if (electronInstance != null) {
            console.log('[electron] Compilation failed. Exiting electron');
            close('electronInstance');
        } else {
            console.log('[electron] Compilation failed.');
        }
    });
    electronWatcher.on('first_success', () => {
        console.log('[electron] Compilation successful. Starting electron instance');
        startElectron();
    });
    electronWatcher.on('subsequent_success', () => {
        console.log('[electron] Recompilation successful. Restarting electron instance');
        startElectron();
    });
    electronWatcher.start('--project', electronProjectDir);
};

console.log('Starting...');


const backendWatcher = procs.backendWatcher = new TscWatchClient();
backendWatcher.on('started', () => {
    console.log('[backend] (Re)Compiling...');
});
backendWatcher.on('compile_errors', () => {
    const electronWatcher = procs.electronWatcher;
    if (electronWatcher) {
        console.log('[backend] Compilation failed. Exiting electron');
        close('electronInstance');
        close('electronWatcher');

    } else {
        console.log('[backend] Compilation failed.');
    }
});
backendWatcher.on('first_success', () => {
    console.log('[backend] Compilation successful. Starting electron watcher');
    startElectronWatcher();
});
backendWatcher.on('subsequent_success', () => {
    console.log('[backend] Compilation successful. (Re)Starting electron watcher');
    startElectronWatcher();
});
backendWatcher.start('--project', backendProjectDir);
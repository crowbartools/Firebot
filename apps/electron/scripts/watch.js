const { TscWatchClient } = require('tsc-watch/client');

const electronPath = require("electron");
const { spawn } = require("child_process");

const path = require('path');
const electronProjectDir = path.resolve(__dirname, '../');
const appsDir = path.resolve(electronProjectDir, '../');
const backendProjectDir = path.resolve(appsDir, './backend/');

const procs = {}
const close = (name, signal = 'SIGINT') => {
    const proc = procs[name];
    if (proc != null) {
        proc.removeAllListeners();
        proc.kill(signal || 'SIGINT');
        proc[name] = null;
    }
}

const shutdown = (reason) => {
    close('electronInstance', reason.prockill);
    close('electronWatcher', reason.prockill);
    close('backendWatcher', reason.prockill);
    if (reason.reason === 'ERROR') {
        console.error(reason.message, reason.origin);
        process.exit(1);
        return;
    }
    process.exit(reason.code);
}

process.on('uncaughtException', (error, origin) => shutdown({ reason: 'ERROR', error, origin }));
process.on('SIGTERM', () => shutdown({ reason: 'EXIT', prockill: 'SIGTERM', code: 0 }));
process.on('SIGINT',  () => shutdown({ reason: 'EXIT', prockill: 'SIGINT', code: 0 }));
process.on('SIGBREAK', () => shutdown({ reason: 'EXIT', prockill: 'SIGBREAK', code: 0 }));
process.on('SIGHUP', () => shutdown({ reason: 'EXIT', prockill: 'SIGHUP', code: 0 }));
process.on('exit', (code) => shutdown({ reason: 'EXIT', prockill: 'SIGINIT', code }));

const startElectron = () => {
    close('electronInstance');

    const electronInstance = procs.electronInstance = spawn(String(electronPath), ["."], {
        env: {
            ...(process.env),
            NODE_ENV: 'development'
        },
        stdio: 'inherit'
    });

    electronInstance.on('error', (code, message) => {
        console.error(`[electron] Error ${code}: `, message);
    });

    electronInstance.on('close', () => {
        procs.electronInstance = null;
        shutdown();
    });
};

const startElectronWatcher = () => {

    close('electronWatcher');

    const electronWatcher = procs.electronWatcher = new TscWatchClient();

    electronWatcher.on('started', () => {
        console.log('[electron] (Re)Compiling...');
    });

    electronWatcher.on('compile_errors', () => {
        if (procs.electronInstance != null) {
            console.warn('[electron] Compilation failed. Exiting electron');
            close('electronInstance');

        } else {
            console.warn('[electron] Compilation failed.');
        }
    });

    electronWatcher.on('success', () => {
        console.log('[electron] Compilation successful. Starting electron instance');
        startElectron();
    });

    electronWatcher.start('--silent', '--project', electronProjectDir);
};

console.log('Starting...');

const backendWatcher = procs.backendWatcher = new TscWatchClient();

backendWatcher.on('started', () => {
    console.log('[backend] (Re)Compiling...');
});

backendWatcher.on('compile_errors', () => {
    if (procs.electronWatcher) {
        console.warn('[backend] Compilation failed. Exiting electron');
        close('electronInstance');
        close('electronWatcher');

    } else {
        console.warn('[backend] Compilation failed.');
    }
});

backendWatcher.on('success', () => {
    console.log('[backend] Compilation successful. Starting electron watcher');
    startElectronWatcher();
});

backendWatcher.start('--silent', '--project', backendProjectDir);
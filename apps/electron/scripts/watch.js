const { main : entryPoint } = require('../package.json');

const { TscWatchClient } = require('tsc-watch/client');

const electronPath = require("electron");
const { spawn } = require("child_process");

const path = require('path');
const electronProjectDir = path.resolve(__dirname, '../');
const appsDir = path.resolve(electronProjectDir, '../');
const backendProjectDir = path.resolve(appsDir, './backend/');

let procs = {}
const close = (name, reason) => {
    const proc = procs[name];
    if (proc != null) {
        proc.removeAllListeners();
        proc.kill(reason || 'SIGINT');
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

process.on('uncaughtException', (error, origin) => shutdown({
    reason: 'ERROR',
    error,
    origin
}));
process.on('SIGTERM', () => shutdown({
    reason: 'EXIT',
    prockill: 'SIGTERM',
    code: 0
}));
process.on('SIGINT',  () => shutdown({
    reason: 'EXIT',
    prockill: 'SIGINT',
    code: 0
}));
process.on('SIGBREAK', () => shutdown({
    reason: 'EXIT',
    prockill: 'SIGBREAK',
    code: 0
}));
process.on('SIGHUP', () => shutdown({
    reason: 'EXIT',
    prockill: 'SIGHUP',
    code: 0
}));
process.on('exit', (code) => shutdown({
    reason: 'EXIT',
    code
}));

const startElectron = () => {
    close('electronInstance');

    procs.electronInstance = spawn(String(electronPath), ["."], {
        env: { NODE_ENV: 'development' },
        stdio: 'inherit'
    });

    procs.electronInstance.on('error', (code, message) => {
        console.log(code, message);
    });

    procs.electronInstance.on('close', () => {
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
        if (electronInstance != null) {
            console.log('[electron] Compilation failed. Exiting electron');
            close('electronInstance');
        } else {
            console.log('[electron] Compilation failed.');
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
    const electronWatcher = procs.electronWatcher;
    if (electronWatcher) {
        console.log('[backend] Compilation failed. Exiting electron');
        close('electronInstance');
        close('electronWatcher');

    } else {
        console.log('[backend] Compilation failed.');
    }
});
backendWatcher.on('success', () => {
    console.log('[backend] Compilation successful. Starting electron watcher');
    startElectronWatcher();
});
backendWatcher.start('--silent', '--project', backendProjectDir);
import path from 'path';

import assetpath from 'assets';

import { app, BrowserWindow} from 'electron';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

// ts/eslint will complain until apps/backend/ has been built
const { default : backendStart } = require('../../backend');

let backend : NestFastifyApplication | void;

let mainWindow : BrowserWindow;
const createWindow = () => {
    if (mainWindow) {
        return;
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(assetpath, 'images/favicon.ico')
    });

    mainWindow.loadURL('http://localhost:3000');
}

process.on('uncaughtException', async function (err) {
    console.error(err.stack);
    if (backend) {
        await backend.close();
    }
    app.quit();
});

(async () => {

    backend = await backendStart();
    if (backend == null) {
        console.error('failed to start backend');
        app.quit();
        return;
    }

    await app.whenReady();
    app.on('window-all-closed', async () => {
        if (process.platform !== 'darwin') {
            if (backend) {
                await backend.close();
            }
            app.quit();
        }
    });
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    createWindow();
})();
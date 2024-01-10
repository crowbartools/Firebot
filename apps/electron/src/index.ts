import path from 'path';

import assetpath from 'assets';

import { app, BrowserWindow, session } from 'electron';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';

// ts/eslint will complain until apps/backend/ has been built
const { default : backendStart } = require('backend');

let backend : { app: NestFastifyApplication, authToken: string } | void;

let mainWindow : BrowserWindow;
const createWindow = () => {
    if (mainWindow) {
        return;
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(assetpath, 'images/favicon.ico'),
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000');
    } else {
        mainWindow.loadURL('http://localhost:3001');
    }
}

process.on('uncaughtException', async function (err) {
    console.error(err.stack);
    if (backend) {
        await backend.app.close();
    }
    app.quit();
});

(async () => {

    backend = await backendStart({
      USER_DATA_PATH: app.getPath("userData")
    });
    if (backend == null) {
        console.error('failed to start backend');
        app.quit();
        return;
    }

    await app.whenReady();
    app.on('window-all-closed', async () => {
        if (process.platform !== 'darwin') {
            if (backend) {
                await backend.app.close();
            }
            app.quit();
        }
    });
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    session.defaultSession.cookies.set({
        url: 'http://localhost:3000',
        name: 'auth',
        value: backend?.authToken,
        httpOnly: false,
        secure: false,
    })

    createWindow();
})();
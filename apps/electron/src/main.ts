import { app, BrowserWindow} from 'electron';

import { NestFastifyApplication } from '@nestjs/platform-fastify';

import path from 'node:path';

import backendBootstrap from '../../backend/dist';

import '../../backend';

let backend : NestFastifyApplication | void;

let mainWindow : BrowserWindow;
const createWindow = () => {
    if (mainWindow) {
        return;
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });

    /*
    const loadFile = path.join(__dirname, "../src/sample.html");
    mainWindow.loadFile(loadFile);
    */
   mainWindow.loadURL('http://localhost:3001/api/v1/example');
}


process.on('uncaughtException', async function (err) {
    console.error(err.stack);
    if (backend) {
        await backend.close();
    }
    app.quit();
});

(async () => {
    backend = await backendBootstrap();
    if (backend == null) {
        console.error('failed to start backend');
        app.quit();
        return;
    }
    await app.whenReady();

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
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
"use strict";
const os = require('os');
const electron = require("electron");

module.exports = function () {
    const {
        app,
        ipcMain
    } = electron;

    ipcMain.on('preload.getAppDetails', (event) => {
        event.returnValue = {
            version: app.getVersion(),
            locale: app.getLocale(),
            isPackaged: app.isPackaged,
            os: {
                isWindows: process.platform === 'win32',
                type: os.type(),
                release: os.release()
            }
        };
    });
    ipcMain.on('preload.app.getPath', (event, ...args) => {
        event.returnValue = app.getPath(...args);
    });
    ipcMain.on('preload.app.getAppPath', (event, ...args) => {
        event.returnValue = app.getAppPath(...args);
    });
};
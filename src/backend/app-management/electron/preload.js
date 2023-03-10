'use strict';

const { ipcRenderer } = require('electron');

const {
    version,
    isPackaged,
    locale,
    os
} = ipcRenderer.sendSync('preload.getAppDetails');

window.firebotAppDetails = {
    getVersion: () => version,
    version,
    isPackaged,
    getLocale: () => locale,
    locale,
    os,
    getAppPath: (...args) => ipcRenderer.sendSync('preload.app.getAppPath', ...args),
    getPath: (...args) => ipcRenderer.sendSync('preload.app.getPath', ...args),
    getAllDisplays: () => ipcRenderer.sendSync('preload.screen.getAllDisplays'),
    getPrimaryDisplay: () => ipcRenderer.sendSync('preload.screen.getPrimaryDisplay'),
    takeScreenshot: (displayId) => ipcRenderer.sendSync('preload.takeScreenshot', displayId),
    openDevTools: () => ipcRenderer.sendSync('preload.openDevTools'),

    updates: {
        check: (...args) => ipcRenderer.invoke('preload.updates.check', ...args),
        download: (...args) => ipcRenderer.invoke('preload.updates.download', ...args),
        install: (...args) => ipcRenderer.send('preload.updates.install', ...args)
    }
};
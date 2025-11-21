"use strict";

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
    on: (channel, listener) => {
        ipcRenderer.on(channel, (_, data) => {
            listener(data);
        });
    },
    send: (channel, ...args) => {
        ipcRenderer.send(channel, ...args);
    },
    sendSync: (channel, ...args) => {
        return ipcRenderer.sendSync(channel, ...args);
    }
});
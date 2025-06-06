"use strict";

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
    on: (channel, listener) => {
        ipcRenderer.on(channel, (_, data) => {
            listener(data);
        });
    },
    clearQueue: (queueID) => {
        ipcRenderer.send("clearEffectQueue", queueID);
    },
    toggleQueue: (queueID) => {
        ipcRenderer.send("toggleEffectQueue", queueID);
    }
});
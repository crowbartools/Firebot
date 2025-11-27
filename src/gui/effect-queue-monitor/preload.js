"use strict";

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
    on: (channel, listener) => {
        ipcRenderer.on(channel, (_, data) => {
            listener(data);
        });
    }
});

contextBridge.exposeInMainWorld('queueManager', {
    clearQueue: (queueID) => {
        ipcRenderer.send("effect-queues:clear-effect-queue", queueID);
    },
    toggleQueue: (queueID) => {
        ipcRenderer.send("effect-queues:toggle-effect-queue", queueID);
    }
});
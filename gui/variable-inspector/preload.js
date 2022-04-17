"use strict";

const { contextBridge, ipcRenderer } = require('electron');
const secrets = require("../../secrets.json");

contextBridge.exposeInMainWorld('ipcRenderer', {
    on: (channel, listener) => {
        ipcRenderer.on(channel, (_, data) => {
            listener(data);
        });
    },
    fontAwesome5KitUrl: `https://kit.fontawesome.com/${secrets.fontAwesome5KitId}.js`,
    deleteVariable: (key) => {
        ipcRenderer.send("customVariableDelete", key);
    }
});
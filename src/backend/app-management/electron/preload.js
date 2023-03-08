'use strict';

const os = require('node:os');
const { app, contextBridge } = require('electron');



contextBridge.exposeInMainWorld('firebotAppDetails', {
    version: app.getVersion(),
    packaged: app.isPackaged,
    os: {
        isWindows: process.platform === 'win32',
        type: os.type(),
        release: os.release()
    }
});
'use strict';

const os = require('node:os');
const { app, contextBridge } = require('electron');



contextBridge.exposeInMainWorld('firebotAppDetails', {
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    locale: app.getLocale(),
    os: {
        isWindows: os.platform() === 'win32',
        type: os.type(),
        release: os.release()
    },
    screens: () => app.screen.getAllDisplays()
});
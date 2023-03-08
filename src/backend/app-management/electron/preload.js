'use strict';
const {
    app,
    contextBridge
} = require('electron');

contextBridge.exposeInMainWorld('firebotAppDetails', {

});
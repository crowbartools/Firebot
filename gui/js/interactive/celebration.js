const {ipcRenderer} = require('electron');
const errorLogger = require('../error-logging/error-logging.js');
const webSocket = require('../websocket.js');

// Show Image Monitor
// Recieves event from main process that an image should be shown.
ipcRenderer.on('celebrate', function (event, data){
    webSocket.broadcast(data);
})
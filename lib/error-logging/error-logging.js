const {ipcMain, BrowserWindow} = require('electron');


// Takes error message and sends it to the ui.
function errorLogging(message){
    // Send Alert
    renderWindow.webContents.send('error', message);
}

// Export Functions
exports.log = errorLogging;
const {ipcMain, BrowserWindow} = require('electron');


// Takes version number and sends it to gui for update check.
function updateCheck(version){
    // Send Alert
    renderWindow.webContents.send('update-check', version);
}

// Export Functions
exports.check = updateCheck;
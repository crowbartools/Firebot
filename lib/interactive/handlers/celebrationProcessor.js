const {ipcMain, BrowserWindow, dialog} = require('electron');

// Send celebration info to overlay.
function celebrate(effect){

    // Get report info
    var celebrationType = effect.celebration;
    var celebrationDuration = effect.length;

    // Send data to renderer.
    var data = {"event": "celebration", "celebrationType": celebrationType, "celebrationDuration":celebrationDuration};
    renderWindow.webContents.send('celebrate', data);
}




// Export Functions
exports.play = celebrate;
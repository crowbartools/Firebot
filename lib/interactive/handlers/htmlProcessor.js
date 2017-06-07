const {ipcMain, BrowserWindow, dialog} = require('electron');

// HTML Processor
function htmlProcessor(effect){

    // They have an image loaded up for this one.
    var HTML = effect.html;
    var duration = effect.length;
    var removal = effect.removal;

    // Send data back to media.js in the gui.
    var data = {"html": HTML, "length": duration, "removal": removal};
    renderWindow.webContents.send('showhtml', data);
}

// Export Functions
exports.show = htmlProcessor;
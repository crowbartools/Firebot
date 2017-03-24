const {ipcMain, BrowserWindow, dialog} = require('electron');
const errorLogger = require('../../error-logging/error-logging.js');

// User Report Processor
// This handles the user report and sends usercount over to render window.
function userReportProcessor(report){
    var userCounter = report.connected;
    var userActive = report.active;

    // Send to render window. (handled in interactive-board.js)
    var data = {"userCount": userCounter};
    renderWindow.webContents.send('usersConnected', data);
};

// Export Functions
exports.send = userReportProcessor;
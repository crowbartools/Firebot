const {ipcMain, BrowserWindow, dialog} = require('electron');
const JsonDB = require('node-json-db');
const errorLog = require('../../error-logging/error-logging.js')

// Send celebration info to overlay.
function celebrate(report){
    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    var activeProfile = dbSettings.getData('./interactive/activeBoard');

    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
	var controls = dbControls.getData('/tactile');

    // Get report info
    var rawid = report.id;
    var holding = report.holding;
    var press = report.pressFrequency;
    var button = controls[rawid];

    if (press > 0){
        // Get user specific settings
        var buttonID = button['id'];
        var typeSettings = button['typeSettings'];
        var celebrationType = typeSettings['celebrationType'];
        var celebrationDuration = typeSettings['celebrationDuration'];

        var data = {"event": "celebration", "celebrationType": celebrationType, "celebrationDuration":celebrationDuration};
        renderWindow.webContents.send('celebrate', data);
    } else if (holding > 0){
		errorLog.log('Celebration should only have pressFrequency on in the dev lab.');
	}
}




// Export Functions
exports.play = celebrate;
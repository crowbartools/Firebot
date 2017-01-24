const {ipcMain, BrowserWindow, dialog} = require('electron');
const JsonDB = require('node-json-db');


// Sound Processor
// This takes info passed from the controls router and sends it back to the render process in order to play a sound file.
function soundProcessor(report){
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
        var filepath = typeSettings['filePath'];
        var volume = typeSettings['volume'];

        var data = {"filepath": filepath, "volume": volume, "buttonID": buttonID}

        renderWindow.webContents.send('playsound', data);
    }

}

// Get File Path
// This opens a dialog and returns a filepath.
function getSoundFilePath(event){
    var path = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Audio', extensions: ['mp3', 'ogg', 'wav']}
        ]
    });
    event.sender.send('gotSoundFilePath', path);
}

// Get File Path
// This listens for an event from the render soundboard.js file to open a dialog to get a filepath.
ipcMain.on('getSoundPath', function(event) {
    getSoundFilePath(event);
});


// Export Functions
exports.play = soundProcessor;
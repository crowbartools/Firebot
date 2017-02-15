const {ipcMain, BrowserWindow, dialog} = require('electron');
const JsonDB = require('node-json-db');

// Media Processor
// This takes info passed from the controls router and sends it back to the render process in order to play media.
function mediaProcessor(report){
    // Get report info
    var rawid = report.id;
    var press = report.pressFrequency;

    if (press > 0){
        // Okay someone pressed something. I guess we'll do some work.
        var dbSettings = new JsonDB('./user-settings/settings', true, false);
        var activeProfile = dbSettings.getData('./interactive/activeBoard');
        var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
        var controls = dbControls.getData('/tactile');

        var button = controls[rawid];

        // Get user specific settings
        var buttonID = button['id'];
        var imagePath = button['media'].imagePath;
        var soundPath = button['media'].soundPath;

        if(imagePath !== "" && imagePath !== undefined){
            // They have an image loaded up for this one.
            var filepath = imagePath;
            var imageX = button['media'].imageX;
            var imageY = button['media'].imageY;
            var duration = button['media'].imageDuration;

            // Send data back to media.js in the gui.
            var data = {"filepath": filepath, "imageX": imageX, "imageY": imageY, "imageDuration": imageDuration};
            renderWindow.webContents.send('showimage', data);
        }

        if(soundPath !== "" && soundPath !== undefined){
            // They have an sound loaded up for this one.
            var filepath = soundPath;
            var volume = button['media'].soundVolume;

            // Send data back to media.js in the gui.
            var data = {"filepath": filepath, "volume": volume, "buttonID": buttonID}
            renderWindow.webContents.send('playsound', data);
        }
    }
}

// Get Sound File Path
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

// Get Sound File Path
// This listens for an event from the render media.js file to open a dialog to get a filepath.
ipcMain.on('getSoundPath', function(event) {
    getSoundFilePath(event);
});

// Get Sound File Path
// This opens a dialog and returns a filepath.
function getSoundFilePath(event){
    var path = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Audio', extensions: ['mp3', 'ogg', 'wav']}
        ]
    });
    event.sender.send('gotImageFilePath', path);
}

// Get Image File Path
// This opens a dialog and returns a filepath.
function getImageFilePath(event){
    var path = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Audio', extensions: ['mp3', 'ogg', 'wav']}
        ]
    });
    event.sender.send('gotImageFilePath', path);
}

// Get Image File Path
// This listens for an event from the render media.js file to open a dialog to get a filepath.
ipcMain.on('getImagePath', function(event) {
    getImageFilePath(event);
});

// Get Image File Path
// This opens a dialog and returns a filepath.
function getImageFilePath(event){
    var path = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Image', extensions: ['jpg', 'gif', 'png', 'jpeg']}
        ]
    });
    event.sender.send('gotImageFilePath', path);
}

// Export Functions
exports.play = mediaProcessor;
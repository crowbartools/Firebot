const {ipcMain, BrowserWindow, dialog} = require('electron');

// Get Sound File Path
// This listens for an event from the render media.js file to open a dialog to get a filepath.
ipcMain.on('getSoundPath', function(event, uniqueid) {
    var path = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Audio', extensions: ['mp3', 'ogg', 'wav']}
        ]
    });
    event.sender.send('gotSoundFilePath', {path: path, id: uniqueid});
});

// Get Image File Path
// This listens for an event from the render media.js file to open a dialog to get a filepath.
ipcMain.on('getImagePath', function(event, uniqueid) {
    var path = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Image', extensions: ['jpg', 'gif', 'png', 'jpeg']}
        ]
    });
    event.sender.send('gotImageFilePath', {path: path, id: uniqueid});
});
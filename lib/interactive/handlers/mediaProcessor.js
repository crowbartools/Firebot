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

// Sound Processor
// This takes info passed from the controls router and sends it back to the render process in order to play media.
function soundProcessor(effect){

    // They have an sound loaded up for this one.
    var filepath = effect.file;
    var volume = effect.volume;

    // Send data back to media.js in the gui.
    var data = {"filepath": filepath, "volume": volume}
    renderWindow.webContents.send('playsound', data);
}

// Image Processor
function imageProcessor(effect){

    // They have an image loaded up for this one.
    var filepath = effect.file;
    var imagePosition = effect.position;
    var imageHeight = effect.height;
    var imageWidth = effect.width;
    var duration = effect.length;

    // Send data back to media.js in the gui.
    var data = {"filepath": filepath, "imagePosition": imagePosition, "imageHeight": imageHeight, "imageWidth": imageWidth, "imageDuration": duration};
    renderWindow.webContents.send('showimage', data);
}

// Export Functions
exports.play = soundProcessor;
exports.show = imageProcessor;
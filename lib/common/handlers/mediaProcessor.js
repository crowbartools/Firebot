const {ipcMain, BrowserWindow, dialog} = require('electron');
const settings = require('../settings-access').settings;
const resourceTokenManager = require('../../resourceTokenManager.js');

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

// Get Video File Path
// This listens for an event from the render media.js file to open a dialog to get a filepath.
ipcMain.on('getVideoPath', function(event, uniqueid) {
    var path = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Video', extensions: ['mp4', 'webm', 'ogv']}
        ]
    });
    event.sender.send('gotVideoFilePath', {path: path, id: uniqueid});
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

    // Send data back to media.js in the gui.
    var data = {
        "filepath": effect.file,
        "volume": effect.volume
    }
    renderWindow.webContents.send('playsound', data);
}

// Image Processor
function imageProcessor(effect){

    // Send data back to media.js in the gui.
    var data = {
        "filepath": effect.file,
        "imagePosition": effect.position,
        "imageHeight": effect.height,
        "imageWidth": effect.width,
        "imageDuration": effect.length,
        "enterAnimation": effect.enterAnimation,
        "exitAnimation": effect.exitAnimation,
        "customCoords": effect.customCoords
    };
    
    if(settings.useOverlayInstances()) {
      if(effect.overlayInstance != null) {
        if(settings.getOverlayInstances().includes(effect.overlayInstance)) {
          data.overlayInstance = effect.overlayInstance;
        }
      }
    }
    
    var resourceToken = resourceTokenManager.storeResourcePath(effect.file);
    data.resourceToken = resourceToken;
    
    renderWindow.webContents.send('showimage', data);
}

// Video Processor
function videoProcessor(effect){

    // Send data back to media.js in the gui.
    var data = {
      "videoType": effect.videoType, 
      "filepath": effect.file, 
      "youtubeId": effect.youtube, 
      "videoPosition": effect.position, 
      "videoHeight": effect.height, 
      "videoWidth": effect.width, 
      "videoDuration": effect.length,
      "videoVolume": effect.volume,
      "videoStarttime": effect.starttime,
      "enterAnimation": effect.enterAnimation,
      "exitAnimation": effect.exitAnimation,
      "customCoords": effect.customCoords
    };
    
    if(settings.useOverlayInstances()) {
      if(effect.overlayInstance != null) {
        if(settings.getOverlayInstances().includes(effect.overlayInstance)) {
          data.overlayInstance = effect.overlayInstance;
        }
      }
    }
    
    var resourceToken = resourceTokenManager.storeResourcePath(effect.file);
    data.resourceToken = resourceToken;
    
    renderWindow.webContents.send('showvideo', data);
}

// Export Functions
exports.sound = soundProcessor;
exports.image = imageProcessor;
exports.video = videoProcessor;
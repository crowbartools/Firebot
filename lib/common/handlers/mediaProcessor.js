'use strict';

const {ipcMain, dialog} = require('electron');
const settings = require('../settings-access').settings;
const resourceTokenManager = require('../../resourceTokenManager.js');

// Get Sound File Path
// This listens for an event from the render media.js file to open a dialog to get a filepath.
ipcMain.on('getSoundPath', function(event, uniqueid) {
    let path = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'flac']}
        ]
    });
    event.sender.send('gotSoundFilePath', {path: path, id: uniqueid});
});

// Get Video File Path
// This listens for an event from the render media.js file to open a dialog to get a filepath.
ipcMain.on('getVideoPath', function(event, uniqueid) {
    let path = dialog.showOpenDialog({
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
    let path = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Image', extensions: ['jpg', 'gif', 'png', 'jpeg']}
        ]
    });
    event.sender.send('gotImageFilePath', {path: path, id: uniqueid});
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPresetLocation() {
    let presetPositions = [
        "Top Left",
        "Top Middle",
        "Top Right",
        "Middle Left",
        "Middle",
        "Middle Right",
        "Bottom Left",
        "Bottom Middle",
        "Bottom Right"
    ];

    let randomIndex = getRandomInt(0, presetPositions.length - 1);
    return presetPositions[randomIndex];
}

// Sound Processor
// This takes info passed from the controls router and sends it back to the render process in order to play media.
function soundProcessor(effect) {

    // Send data back to media.js in the gui.
    let data = {
        "filepath": effect.file,
        "volume": effect.volume,
        "audioOutputDevice": effect.audioOutputDevice
    };
    renderWindow.webContents.send('playsound', data);
}

// Image Processor
function imageProcessor(effect) {

    // Send data back to media.js in the gui.

    let position = effect.position;
    if (position === "Random") {
        position = getRandomPresetLocation();
    }

    let data = {
        "filepath": effect.file,
        "url": effect.url,
        "imageType": effect.imageType,
        "imagePosition": position,
        "imageHeight": effect.height,
        "imageWidth": effect.width,
        "imageDuration": effect.length,
        "enterAnimation": effect.enterAnimation,
        "exitAnimation": effect.exitAnimation,
        "customCoords": effect.customCoords
    };

    if (settings.useOverlayInstances()) {
        if (effect.overlayInstance != null) {
            if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                data.overlayInstance = effect.overlayInstance;
            }
        }
    }

    if (effect.imageType == null) {
        effect.imageType = 'local';
    }

    if (effect.imageType === 'local') {
        let resourceToken = resourceTokenManager.storeResourcePath(effect.file);
        data.resourceToken = resourceToken;
    }

    renderWindow.webContents.send('showimage', data);
}

// Video Processor
function videoProcessor(effect) {

    let position = effect.position;
    if (position === "Random") {
        position = getRandomPresetLocation();
    }

    // Send data back to media.js in the gui.
    let data = {
        "videoType": effect.videoType,
        "filepath": effect.file,
        "youtubeId": effect.youtube,
        "videoPosition": position,
        "videoHeight": effect.height,
        "videoWidth": effect.width,
        "videoDuration": effect.length,
        "videoVolume": effect.volume,
        "videoStarttime": effect.starttime,
        "enterAnimation": effect.enterAnimation,
        "exitAnimation": effect.exitAnimation,
        "customCoords": effect.customCoords
    };

    if (settings.useOverlayInstances()) {
        if (effect.overlayInstance != null) {
            if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                data.overlayInstance = effect.overlayInstance;
            }
        }
    }

    let resourceToken = resourceTokenManager.storeResourcePath(effect.file);
    data.resourceToken = resourceToken;

    renderWindow.webContents.send('showvideo', data);
}

// Export Functions
exports.sound = soundProcessor;
exports.image = imageProcessor;
exports.video = videoProcessor;

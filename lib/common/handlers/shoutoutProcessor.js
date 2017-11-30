'use strict';

const settings = require('../settings-access').settings;
const resourceTokenManager = require('../../resourceTokenManager.js');
const Media = require('./mediaProcessor.js');

// Shoutout Processor
function shoutoutProcessor(username, effect) {

    let position = effect.position;
    if (position === "Random") {
        position = Media.randomLocation();
    }

    // Send data back to media.js in the gui.
    let data = {
        "shoutoutPosition": position,
        "shoutoutHeight": effect.height,
        "shoutoutWidth": effect.width,
        "shoutoutDuration": effect.length,
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

    renderWindow.webContents.send('shoutout', data);
}


// Export Functions
exports.go = shoutoutProcessor;
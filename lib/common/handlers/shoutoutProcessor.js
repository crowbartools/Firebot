'use strict';

const settings = require('../settings-access').settings;
const resourceTokenManager = require('../../resourceTokenManager.js');
const Media = require('./mediaProcessor.js');

// Shoutout Processor
function shoutoutProcessor(effect, participant, control) {
    let username = participant.username;
    let controlText = control.text;
    let controlCost = control.cost;
    let controlCooldown = control.cooldown;
    let text = effect.text;

    let position = effect.position;
    if (position === "Random") {
        position = Media.randomLocation();
    }

    // Replace 'user' varibles
    if (text !== null && text !== undefined) {
        text = text.replace('$(user)', username);
        text = text.replace('$(text)', controlText);
        text = text.replace('$(cost)', controlCost);
        text = text.replace('$(cooldown)', controlCooldown);
    }

    // Send data back to media.js in the gui.
    let data = {
        "shoutoutText": text,
        "shoutoutColor": effect.color,
        "shoutoutFontSize": effect.size,
        "shoutoutPosition": position,
        "shoutoutHeight": effect.height,
        "shoutoutWidth": effect.width,
        "shoutoutDuration": effect.length,
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
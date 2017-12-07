'use strict';

const settings = require('../settings-access').settings;
const resourceTokenManager = require('../../resourceTokenManager.js');
const Media = require('./mediaProcessor.js');

// Show Text Processor
function showEventsProcessor(effect, participant, control) {

    // If override false, use global settings.
    if (effect.override === false) {
        effect = settings.getEventSettings();
    }

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
        "showEventsText": text,
        "showEventsType": effect.textType,
        "showEventsColor": effect.color,
        "showEventsBackgroundColor": effect.backgroundColor,
        "showEventsFontSize": effect.size,
        "showEventsPosition": position,
        "showEventsAlignment": effect.textAlignment,
        "showEventsHeight": effect.height,
        "showEventsWidth": effect.width,
        "showEventsDuration": effect.length,
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

    renderWindow.webContents.send('showEvents', data);
}


// Export Functions
exports.go = showEventsProcessor;
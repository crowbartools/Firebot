'use strict';

const settings = require('../settings-access').settings;
const resourceTokenManager = require('../../resourceTokenManager.js');
const Media = require('./mediaProcessor.js');

// Show Text Processor
function showEventsProcessor(effect, trigger) {

    // Take global settings and effect settings and combine them into one packet.
    let combinedEffect = {},
        globalEffect = settings.getEventSettings();

    Object.keys(globalEffect).forEach((key) => combinedEffect[key] = globalEffect[key]);
    Object.keys(effect).forEach((key) => combinedEffect[key] = effect[key]);

    effect = combinedEffect;

    // Let's start processing.
    let control = trigger.metadata.control,
        username = trigger.metadata.username,
        controlText = control.text,
        controlCost = control.cost,
        controlCooldown = control.cooldown,
        text = effect.text,
        position = effect.position,
        data = {};

    // If the position is random, let's randomize things!
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
    data = {
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

    let resourceToken = resourceTokenManager.storeResourcePath(effect.file, effect.length);
    data.resourceToken = resourceToken;

    renderWindow.webContents.send('showEvents', data);
}


// Export Functions
exports.go = showEventsProcessor;
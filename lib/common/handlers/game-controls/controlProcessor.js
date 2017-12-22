'use strict';
const tactile = require('./tactile');

// Counter Variable
global.buttonSaves = {};

// Button Router
// This checks to see if a button needs pressed, and if so it sends it off for processing.
function buttonRouter(eventType, effect) {
    let key = effect.press;
    let oppositeKey = effect.opposite;
    let holding = effect.holding;
    let modifiers = effect.modifiers;

    let keyNum = global.buttonSaves[key];

    // If button has an opposite do stuff, otherwise just press the button.
    if (oppositeKey !== undefined) {
        // Check to see which has more people pressing it.
        let oppNum = global.buttonSaves[oppositeKey];

        // Set defaults
        if (holding === undefined) {
            holding = "No";
        }

        if (oppNum === undefined) {
            oppNum = 0;
        }

        // Send off the keys to be pressed.
        if (keyNum >= oppNum) {
            // Press key
            tactile.buttonPress(eventType, key, keyNum, oppositeKey, oppNum, holding, modifiers);
        } else {
            // Press Opposite Key
            tactile.buttonPress(eventType, oppositeKey, oppNum, key, keyNum, holding, modifiers);
        }
    } else {
        let oppNum = 0;
        // Press Key
        tactile.buttonPress(eventType, key, keyNum, false, oppNum, holding, modifiers);
    }
}


// Counter
// This counts each keypress that comes in and either adds or subtracks one for key comparisons.
function keyCounter(eventType, effect) {
    let key = effect.press;

    // See if we need to add or remove one press.
    if (eventType === "mousedown") {
        let keySave = global.buttonSaves[key];
        if (keySave === undefined) {
            keySave = 0;
        }
        global.buttonSaves[key] = keySave + 1;
    } else {
        let keySave = global.buttonSaves[key];
        if (keySave === undefined) {
            keySave = 0;
        }
        global.buttonSaves[key] = keySave - 1;
    }

    // Press counted, send it off!
    buttonRouter(eventType, effect);
}

// Exports
exports.press = keyCounter;

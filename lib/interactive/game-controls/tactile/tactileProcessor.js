const JsonDB = require('node-json-db');
const keyTranslator = require('../key-translator.js');
const emulate = require('../emulator.js');

// Global for button save events.
global.buttonSaves = {};

// Tactile Handler
function tactile(report) {
    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    var activeProfile = dbSettings.getData('./interactive/activeBoard');

    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
	var boardControls = dbControls.getData('/tactile');

    // Get Button Settings for ID
    var rawid = report.id;
    var holding = report.holding;
    var press = report.pressFrequency;
    var button = boardControls[rawid];

    if (press > 0 || holding > 0){
        // Get user defined settings
        var buttonID = button['id'];
        var typeSettings = button['typeSettings'];
        var key = typeSettings['press'];
        var oppositeKey = typeSettings['opposite'];
        
        // Translate the key to appropriate handler language.
        var key = keyTranslator.translate(key);
        var oppositeKey = keyTranslator.translate(oppositeKey);

        // Save details to global var for key comparisons.
        buttonSave(key, holding, press);

        // Route button to correct handler for it's purpose.
        if (oppositeKey !== "") {
            movement(key, oppositeKey, buttonID);
        } else if (isNaN(holding) === false) {
            tactileHold(key, holding, buttonID);
        } else {
            tactileTap(key, press, buttonID);
        }
    }
}

// Button Saves
// Constantly saves holding number to var for reference in key versus comparisons.
function buttonSave(key, holding, press) {

    if (holding > 0) {
        global.buttonSaves[key] = holding;
    } else if (press > 0) {
        global.buttonSaves[key] = press;
    } else {
        global.buttonSaves[key] = 0;
    }

    if (global.buttonSaves[key + 'Pressed'] === undefined) {
        global.buttonSaves[key + 'Pressed'] = false;
    }
}

// Movement Keys
function movement(key, oppositeKey, buttonID) {

    // Get saved states for related keys.
    var keyOne = global.buttonSaves[key];
    var keyOnePressed = global.buttonSaves[key + 'Pressed'];
    var keyTwo = global.buttonSaves[oppositeKey];
    var keyTwoPressed = global.buttonSaves[oppositeKey + 'Pressed'];

    console.log(keyOne, keyOnePressed, keyTwo, keyTwoPressed);

    // See if key two has been saved yet.
    if (keyTwo === undefined || keyTwo === null) {
        var keyTwo = 0;
        var keyTwoPressed = false;
    }

    if (keyOne > keyTwo && keyOnePressed === false) {
        emulate.keyToggle(key, "down");
        global.buttonSaves[key + 'Pressed'] = true;
    }
    if (keyTwo > keyOne && keyTwoPressed === false) {
        emulate.keyToggle(oppositeKey, "down");
        global.buttonSaves[oppositeKey + 'Pressed'] = true;
    }
    if (keyOne === keyTwo) {
        if (keyOnePressed === true) {
            emulate.keyToggle(key, "up");
            global.buttonSaves[key + 'Pressed'] = false;
        }
        if (keyTwoPressed === true) {
            emulate.keyToggle(oppositeKey, "up");
            global.buttonSaves[oppositeKey + 'Pressed'] = false;
        }
    }
}

// Tactile Key Hold
function tactileHold(key, holding, buttonID) {
    var key = keyTranslator.translate(key);

    if (global.buttonSaves[key] > 0 && global.buttonSaves[key + 'Pressed'] !== true) {
        emulate.keyToggle(key, "down");
        global.buttonSaves[key + 'Pressed'] = true;
    } else if (holding === 0 && global.buttonSaves[key + 'Pressed'] !== false) {
        emulate.keyToggle(key, "up");
        global.buttonSaves[key + 'Pressed'] = false;
    }
}

// Tactile Key Tap.
function tactileTap(key, press, buttonID) {
    var key = keyTranslator.translate(key);

    if (press > 0) {
        emulate.keyToggle(key, "down");
        setTimeout(function() {
            emulate.keyToggle(key, "up");
        }, 20);
    }
}



// Export main function
exports.tactile = tactile;
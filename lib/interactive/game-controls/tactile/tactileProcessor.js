const JsonDB = require('node-json-db');
const keyTranslator = require('../key-translator.js');
const emulate = require('../emulator.js');

const errorLog = require('../../../error-logging/error-logging.js')

// Button State Global
// Global for saving button states for comparison between reports.
global.buttonState = {};

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

    if (press !== null || holding !== null){

        // Get user defined settings
        var buttonID = button['id'];
        var typeSettings = button['typeSettings'];
        var key = typeSettings['press'];
        var oppositeKey = typeSettings['opposite'];
        var modifiers = typeSettings['modifiers'];

        // Route button to correct handler for it's purpose.
        if(modifiers !== undefined && modifiers instanceof Array){
            // Multikey button
            multiKey(key, modifiers, press);
        } else if (oppositeKey !== "") {
            // Key comparison
            movement(key, oppositeKey, buttonID);
        } else if ( isNaN(holding) === false && holding !== null) {
            // Holding key
            tactileHold(key, holding, buttonID);
        } else {
            // Tap it
            tactileTap(key, press);
        }
    } else {
        // This button doesnt have press frequency or holding checked in dev lab.
        errorLog.log('Button '+rawid+' does not have press frequency or holding checked in the dev lab.');
    }

}

// Button Saves
// This is given the full tactile report, and saves out number of button presses and stats for comparison.
function buttonSave(report) {

    // Global for button save events.
    // Clear this out each time we parse the report to get fresh numbers.
    global.buttonSaves = {};

    // Get the controls file info
    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    var activeProfile = dbSettings.getData('./interactive/activeBoard');
    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
	var controls = dbControls.getData('/tactile');

    // Sort through the report.
    var i = report.length;
    while (i--) {
        // Get Button Settings for ID
        var buttonReport = report[i];
        var rawid = buttonReport.id;
        var holding = buttonReport.holding;
        var press = buttonReport.pressFrequency;
        var button = controls[rawid];

        try{
            // Get user defined settings
            var buttonID = button['id'];
            var typeSettings = button['typeSettings'];
            var key = typeSettings['press'];
            var oppositeKey = typeSettings['opposite'];

            // Translate the key to appropriate handler language.
            var key = keyTranslator.translate(key);
            var oppositeKey = keyTranslator.translate(oppositeKey);

            // Save stats to global var for key comparison
            global.buttonSaves[key] = holding !== null ? holding : press;
        } catch(err){
            errorLog.log('Button '+rawid+' does not exist on your controls board. If it is showing, try removing and re-adding. (buttonSaves)');
        }
    }
}

// Tactile Key Tap.
function multiKey(key, modifiers, press) {
    if (press > 0) {
        var key = keyTranslator.translate(key);

        // Scrub the modifiers list and make a clean array.
        var cleanModifiers = [];
        for (var i in modifiers){
            var cleanButton = keyTranslator.translate(modifiers[i]);
            cleanModifiers.push(cleanButton);
        }

        emulate.multiKeyToggle(key, "down", cleanModifiers);

        setTimeout(function() {
            emulate.multiKeyToggle(key, "up", cleanModifiers);
        }, 30);
    }
}

// Movement Keys
function movement(key, oppositeKey, buttonID) {
    var key = keyTranslator.translate(key);
    var oppositeKey = keyTranslator.translate(oppositeKey);

    // Get saved states for related keys.
    var keyOne = global.buttonSaves[key] || 0;
    var keyOnePressed = global.buttonState[key + 'Pressed'] || false;
    var keyTwo = global.buttonSaves[oppositeKey] || 0;
    var keyTwoPressed = global.buttonState[oppositeKey + 'Pressed'] || false;

    if (keyOne > keyTwo && keyOnePressed === false) {
        emulate.keyToggle(oppositeKey, "up");
        global.buttonState[oppositeKey + 'Pressed'] = false;

        emulate.keyToggle(key, "down");
        global.buttonState[key + 'Pressed'] = true;
    }

    if (keyOne === keyTwo) {
        if (keyOnePressed === true) {
            emulate.keyToggle(key, "up");
            global.buttonState[key + 'Pressed'] = false;
        }
        if (keyTwoPressed === true) {
            emulate.keyToggle(oppositeKey, "up");
            global.buttonState[oppositeKey + 'Pressed'] = false;
        }
    }
}

// Tactile Key Hold
function tactileHold(key, holding, buttonID) {
    var key = keyTranslator.translate(key);

    if (typeof global.buttonState[key + 'Pressed'] === "undefined"){
        global.buttonState[key + 'Pressed'] = false;
    }

    if (holding > 0 && global.buttonState[key + 'Pressed'] === false) {
        emulate.keyToggle(key, "down");
        global.buttonState[key + 'Pressed'] = true;
    } else if (holding === 0 && global.buttonState[key + 'Pressed'] === true) {
        emulate.keyToggle(key, "up");
        global.buttonState[key + 'Pressed'] = false;
    }
}

// Tactile Key Tap.
function tactileTap(key, press) {
    if (press > 0) {
        var key = keyTranslator.translate(key);
        emulate.keyToggle(key, "down");

        setTimeout(function() {
            emulate.keyToggle(key, "up");
        }, 30);
    }
}

// Export main function
exports.tactile = tactile;
exports.buttonSaves = buttonSave;
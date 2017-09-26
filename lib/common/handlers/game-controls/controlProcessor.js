const tactile = require('./tactile');

// Counter Variable
global.buttonSaves = {};

// Counter
// This counts each keypress that comes in and either adds or subtracks one for key comparisons.
function keyCounter(eventType, effect, control){
    var key = effect.press;

    // See if we need to add or remove one press.
    if(eventType == "mousedown"){
        var keySave = global.buttonSaves[key];
        if (keySave === undefined){
            var keySave = 0;
        }
        global.buttonSaves[key] = keySave + 1;
    } else {
        var keySave = global.buttonSaves[key];
        if (keySave === undefined){
            var keySave = 0;
        }
        global.buttonSaves[key] = keySave - 1;
    }

    // Press counted, send it off!
    buttonRouter(eventType, effect, control);
}

// Button Router
// This checks to see if a button needs pressed, and if so it sends it off for processing.
function buttonRouter(eventType, effect, control){
    var key = effect.press;
    var oppositeKey = effect.opposite;
    var holding = effect.holding;
    var modifiers = effect.modifiers;
    
    var keyNum = global.buttonSaves[key];

    // If button has an opposite do stuff, otherwise just press the button.
    if(oppositeKey !== undefined){
        // Check to see which has more people pressing it.
        var oppNum = global.buttonSaves[oppositeKey];

        // Set defaults
        if(holding === undefined){
            var holding = "No";
        }
        if(oppNum === undefined){
            var oppNum = 0;
        }

        // Send off the keys to be pressed.
        if(keyNum >= oppNum){
            // Press key
            tactile.buttonPress(eventType, key, keyNum, oppositeKey, oppNum, holding, modifiers);
        } else {
            // Press Opposite Key
            tactile.buttonPress(eventType, oppositeKey, oppNum, key, keyNum, holding, modifiers);
        }
    } else {
        // Press Key
        tactile.buttonPress(eventType, key, keyNum, false, oppNum, holding, modifiers);
    }
}

// Exports
exports.press = keyCounter;

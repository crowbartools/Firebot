const emulator = require('./emulator');

// Press Status
global.buttonPresses = []

// Button Presser
// This function takes an input and decides if it needs to be pressed or lifted.
function buttonPresser(eventType, key, keyNum, oppositeKey, oppNum, holding, modifiers){

    // See if this is a key that needs to be held down or not.
    if(holding == "Yes"){
        keyHolding(key, oppositeKey, keyNum, modifiers);
    } else {
        if(eventType == "mousedown"){
            keyTap(key, oppositeKey, modifiers);
        }
    }
    
}

// Key Tap
// This function taps a button.
function keyTap(key, oppositeKey, modifiers){
    // Press Key
    console.log(key+' has been tapped.')
    global.buttonPresses[key] = true;
    emulator.tap(key, modifiers);
}

// Key Holding
// This function will hold down a key.
function keyHolding(key, oppositeKey, keyNum, modifiers){
    var keyPressed = global.buttonPresses[key];
    var oppPressed = global.buttonPresses[oppositeKey];

    // Lift up opposite key if it's being pressed.
    if (oppPressed === true){
        console.log(oppositeKey+' has been lifted.')
        global.buttonPresses[oppositeKey] = false;
        emulator.hold(key, 'up', modifiers);
    }

    // If the number of people pressing the key is zero, lift it. Else make sure it's being pressed.
    if(keyNum === 0){
        // Lift key
        console.log(key+' has been lifted due to no one holding it down.')
        global.buttonPresses[key] = false;
        emulator.hold(key, 'up', modifiers);
    } else {
        // Press Key
        if(keyPressed === true){
            // Key already pressed, so do nothing.
        } else {
            console.log(key+' has been held.')
            global.buttonPresses[key] = true;
            emulator.hold(key, 'down', modifiers);
        }
    }
}

// Exports
exports.buttonPress = buttonPresser;
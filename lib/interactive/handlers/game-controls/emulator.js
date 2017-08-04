const robotjs = require('robotjs');
const kbmRobot = require('kbm-robot');
const keyTranslator = require('./keytranslator');

kbmRobot.startJar();

// Key Tap
function keyTap(key, modifiers){
    var keyJson = keyTranslator.translate(key);
    var key = keyJson.key;
    var emulator = keyJson.emulator;
    var isMouseClick = keyJson.isMouseClick;
    var cleanModifiers = []
    
    // Clean Modifiers, this takes all of the modifiers and converts them to the appropriate key for the selected emulator.
    try{
        if(modifiers !== null && modifiers !== undefined){
            for (modifier of modifiers){
                console.log('Translating '+modifier);
                var modKey = keyTranslator.translate(modifier);
                cleanModifiers.push(modKey.key)
            }
        }
    }catch(err){
        console.log(err);
    }


    // Check the emulator and process key.
    if(emulator == "KBMRobot"){
        // Press as KBMRobot
        try{
            console.log('KBMRobot: Tapped '+key+' with modifiers '+cleanModifiers);
            // Special check for mouse clicks
            if(isMouseClick === true) {     
              kbmRobot.mouseClick(key)
                      .go();     
            } else if (cleanModifiers.length === 0) {
              kbmRobot.press(key)
                      .sleep(30)
                      .release(key)
                      .go();
           } else if (cleanModifiers.length === 1) {
              kbmRobot.press(cleanModifiers[0])
                      .press(key)
                      .sleep(30)
                      .release(key)
                      .release(cleanModifiers[0])
                      .go();
           } else if (cleanModifiers.length === 2) {
              kbmRobot.press(cleanModifiers[0])
                      .press(cleanModifiers[1])
                      .press(key)
                      .sleep(30)
                      .release(key)
                      .release(cleanModifiers[0])
                      .release(cleanModifiers[1])
                      .go();
           } else if (cleanModifiers.length === 3) {
              kbmRobot.press(cleanModifiers[0])
                      .press(cleanModifiers[1])
                      .press(cleanModifiers[2])
                      .press(key)
                      .sleep(30)
                      .release(key)
                      .release(cleanModifiers[0])
                      .release(cleanModifiers[1])
                      .release(cleanModifiers[2])
                      .go();
           }
        }catch(err){
            console.log(err);
            renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
        }
    } else {
        // Press as robotjs.
        try{
            console.log('Robotjs: Tapped '+key+' with modifiers '+cleanModifiers);
            // Special check for mouse clicks
            if(isMouseClick === true) {   
              robotjs.mouseClick(key);     
            } else {
                // Key toggle seems to pick up better than keytap with most programs.
                robotjs.keyToggle(key, "down", cleanModifiers);
                setTimeout(function() {
                    robotjs.keyToggle(key, "up", cleanModifiers);
                }, 30);
            }
        }catch(err){
            console.log(err);
            renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
        }
    }
}

// Key Holding
function keyHolding(key, state, modifiers){
    var keyJson = keyTranslator.translate(key);
    var key = keyJson.key;
    var emulator = keyJson.emulator;
    var isMouseClick = keyJson.isMouseClick;
    var cleanModifiers = []
    
    // Clean Modifiers, this takes all of the modifiers and converts them to the appropriate key for the selected emulator.
    if(modifiers != null){
        for (modifier of modifiers){
            var modKey = keyTranslator.translate(modifier);
            cleanModifiers.push(modKey.key)
        }
    }

    // Check the emulator and process key.
    if(emulator == "KBMRobot"){
        if(state == "down"){
            try{
                console.log('KBMRobot: Held '+key+' and modifiers '+cleanModifiers);
                // Special check for mouse clicks
                if(isMouseClick === true) {
                  kbmRobot.mousePress(key)
                          .go();
                } else if (cleanModifiers.length === 0) {
                  kbmRobot.press(key)
                          .go();
                } else if (cleanModifiers.length === 1) {
                  kbmRobot.press(cleanModifiers[0])
                          .press(key)
                          .go();
                } else if (cleanModifiers.length === 2) {
                  kbmRobot.press(cleanModifiers[0])
                          .press(cleanModifiers[1])
                          .press(key)
                          .go();
                } else if (cleanModifiers.length === 3) {
                  kbmRobot.press(cleanModifiers[0])
                          .press(cleanModifiers[1])
                          .press(cleanModifiers[2])
                          .press(key)
                          .go();
                }
            }catch(err){
                console.log(err);
                renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
            }
        } else {
            try{
                console.log('KBMRobot: Released '+key+' and modifiers '+cleanModifiers);
                // Special check for mouse clicks
                if(isMouseClick === true) {
                  kbmRobot.mouseRelease(key)
                          .go();
                } else if (cleanModifiers.length === 0){
                  kbmRobot.release(key)
                          .go();
                } else if (cleanModifiers.length === 1){
                  kbmRobot.release(key)
                          .release(cleanModifiers[0])
                          .go();
                } else if (cleanModifiers.length === 2){
                  kbmRobot.release(key)
                          .release(cleanModifiers[0])
                          .release(cleanModifiers[1])
                          .go();
                } else if (cleanModifiers.length === 3){
                  kbmRobot.release(key)
                          .release(cleanModifiers[0])
                          .release(cleanModifiers[1])
                          .release(cleanModifiers[2])
                          .go();
                }
            }catch(err){
                console.log(err);
                renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
            }
        }
    } else {
        try{
            console.log('Robotjs: Toggled '+key+' '+state+'.');
            // Special check for mouse clicks
            if(isMouseClick === true) {
              // Oddly, the key and state args are reversed compared to the
              // the keyToggle call
              robotjs.mouseToggle(state, key);
            } else {
              robotjs.keyToggle(key, state, cleanModifiers);
            }
            
        }catch(err){
            console.log(err);
            renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
        }
    }
}

// Exports
exports.tap = keyTap;
exports.hold = keyHolding;
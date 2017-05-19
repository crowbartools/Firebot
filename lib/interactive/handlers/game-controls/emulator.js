const robotjs = require('robotjs');
const kbmRobot = require('kbm-robot');
const JsonDB = require('node-json-db');
const keyTranslator = require('./keytranslator');

kbmRobot.startJar();

// Key Tap
function keyTap(key){
    var keyJson = keyTranslator.translate(key);
    var key = keyJson.key;
    var emulator = keyJson.emulator;

    // Check the emulator and process key.
    if(emulator == "KBMRobot"){
        // Press as KBMRobot
        try{
            console.log('KBMRobot: Tapped '+key);
            kbmRobot.press(key)
                    .sleep(100)
                    .release(key)
                    .go();
        }catch(err){
            renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
        }
    } else {
        // Press as robotjs.
        try{
            console.log('Robotjs: Tapped '+key);
            robotjs.keyTap(key);
        }catch(err){
            renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
        }
    }
}

// Key Holding
function keyHolding(key, state){
    var keyJson = keyTranslator.translate(key);
    var key = keyJson.key;
    var emulator = keyJson.emulator;

    // Check the emulator and process key.
    if(emulator == "KBMRobot"){
        if(state == "down"){
            try{
                console.log('KBMRobot: Held '+key);
                kbmRobot.press(key)
                        .go();
            }catch(err){
                renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
            }
        } else {
            try{
                console.log('KBMRobot: Released '+key);
                kbmRobot.release(key)
                        .go();
            }catch(err){
                renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
            }
        }
    } else {
        try{
            console.log('Robotjs: Toggled '+key+' '+state+'.');
            robotjs.keyToggle(key, state);
        }catch(err){
            renderWindow.webContents.send('error', "There was an error trying to press button: "+key);
        }
    }
}

// Exports
exports.tap = keyTap;
exports.hold = keyHolding;
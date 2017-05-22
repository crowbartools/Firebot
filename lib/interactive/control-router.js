const {ipcMain, BrowserWindow, dialog} = require('electron');
const beamInteractive = require('./beam-interactive');
const cooldown = require('./cooldowns.js');
const JsonDB = require('node-json-db');

// Handlers
const mediaHandler = require('./handlers/mediaProcessor.js');
const apiHandler = require('./handlers/apiProcessor.js');
const chatHandler = require('./handlers/chatProcessor.js');
const celebration = require('./handlers/celebrationProcessor.js');
const media = require('./handlers/mediaProcessor.js');
const cdHandler = require('./handlers/cooldownProcessor.js');
const controlHandler = require('./handlers/controlProcessor.js');

// Control Router
// This function takes in every button press and routes the info to the right destination.
function controlRouter(mouseevent, beamControls, beamControl, gameJson, inputEvent, participant){
    var controlID = inputEvent.input.controlID;
    var firebot = gameJson.firebot;
    var control = firebot.controls[controlID];
    var effects = control.effects;

    // Log input event.
    //console.log(inputEvent);
    //console.log(participant);
    //console.log(control);

    // Check to see if this is a mouse down or mouse up event.
    if(mouseevent == "mousedown"){
        // Mouse Down event called.

        // Loop through effects for this button.
        for (var item in effects){
            var effect = effects[item];
            var effectType = effect.type;

            // For each effect, send it off to the appropriate handler.
            switch(effectType){
                case "API Button":
                    apiHandler.go(effect);
                    break;
                case "Change Scene":
                    console.log('Change Scene effect is not currently supported by Beam in node.');
                    break;
                case "Chat":
                    chatHandler.send(effect, participant);
                    break;
                case "Cooldown":
                    cdHandler.go(beamControls, beamControl, effect)
                    break;
                case "Celebration":
                    celebration.play(effect);
                    break;
                case "Game Control":
                    controlHandler.press('mousedown', effect, control);
                    break;
                case "Play Sound":
                    media.play(effect);
                    break;
                case "Show Image":
                    media.show(effect);
                    break;
                default:
                    renderWindow.webContents.send('error', "Oops! This effect type doesnt exist: "+effectType);
                    console.log('Oops! This effect type doesnt exist: '+effectType);
            }
        }
    } else {
        // Mouse up event called.

        // Loop through effects for this button.
        for (var item in effects){
            var effect = effects[item];
            var effectType = effect.type;

            // See if the effect is game control.
            if(effectType == "Game Control"){
                controlHandler.press('mouseup', effect, control);
            }
        }
    }

    // Throw this information into the moderation panel.
    renderWindow.webContents.send('eventlog', {username: participant.username, event: "pressed the "+controlID+" button."});

    // Cooldown Button or Buttons
    cooldown.router(beamControls, beamControl, firebot, control);

    // Charge sparks for the button that was pressed.
    if (inputEvent.transactionID) {
        // This will charge the user.
        beamInteractive.sparkTransaction(inputEvent.transactionID);
    };
}

// Manual Play
// This function will active a button when it is manually triggered via the ui.
function manualPlay(controlID){

    // Get current controls board and set vars.
    try{
        // Get last board name.
        var dbSettings = new JsonDB("./user-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

        var control = dbControls.getData('./firebot/controls/'+controlID);
    } catch(err){
        renderWindow.webContents.send('error', "There was an error trying to manually activate this button.");
        console.log(err);
        return;
    };

    var effects = control.effects;

    // Loop through effects for this button.
    for (var item in effects){
        var effect = effects[item];
        var effectType = effect.type;

        // For each effect, send it off to the appropriate handler.
        switch(effectType){
            case "API Button":
                apiHandler.go(effect);
                break;
            case "Change Scene":
                console.log('Change Scene effect is not currently supported by Beam in node.');
                break;
            case "Chat":
                chatHandler.send(effect, {username: 'Streamer'});
                break;
            case "Cooldown":
                console.log('We wont cooldown a button when manually clicked.');
                break;
            case "Celebration":
                celebration.play(effect);
                break;
            case "Game Control":
                controlHandler.press('mousedown', effect);
                controlHandler.press('mouseup', effect);
                break;
            case "Play Sound":
                media.play(effect);
                break;
            case "Show Image":
                media.show(effect);
                break;
            default:
                renderWindow.webContents.send('error', "Oops! This effect type doesnt exist: "+effectType);
                console.log('Oops! This effect type doesnt exist: '+effectType);
        }
    }

    // Throw this information into the moderation panel.
    renderWindow.webContents.send('eventlog', {username: 'You', event: "Manually pressed the "+controlID+" button."});
}

// Manually play a button.
// This listens for an event from the render and will activate a button manually.
ipcMain.on('manualButton', function(event, controlID) {
    manualPlay(controlID);
});

// Export Functions
exports.router = controlRouter;
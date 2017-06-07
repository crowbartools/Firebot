const {ipcMain, BrowserWindow, dialog} = require('electron');
const mixerInteractive = require('./mixer-interactive');
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
const changeGroupHandler = require('./handlers/changeGroupProcessor.js');
const changeSceneHandler = require('./handlers/changeSceneProcessor.js');
const customScriptHandler = require('./handlers/customScriptProcessor.js');
const diceHandler = require('./handlers/diceProcessor.js');
const htmlHandler = require('./handlers/htmlProcessor.js');

// Control Router
// This function takes in every button press and routes the info to the right destination.
function controlRouter(mouseevent, mixerControls, mixerControl, gameJson, inputEvent, participant){
    var controlID = inputEvent.input.controlID;
    var firebot = gameJson.firebot;
    var control = firebot.controls[controlID];
    var effects = control.effects;
    var username = "";
    if(participant) {
      username = participant.username;
    }

    // Log input event.
    //console.log(inputEvent);
    //console.log(participant);
    //console.log(control);

    // Check to see if this is a mouse down or mouse up event.
    if(mouseevent == "mousedown"){
        // Mouse Down event called.

        // Cooldown Button or Buttons
        cooldown.router(mixerControls, mixerControl, firebot, control, function(response){

            // Loop through effects for this button.
            for (var item in effects){
                var effect = effects[item];
                var effectType = effect.type;

                // For each effect, send it off to the appropriate handler.
                switch(effectType){
                    case "API Button":
                        apiHandler.go(effect);
                        break;
                    case "Change Group":
                        changeGroupHandler.go(participant, effect, firebot)
                        break;
                    case "Change Scene":
                        changeSceneHandler.go(effect, firebot);
                        break;
                    case "Chat":
                        chatHandler.send(effect, participant);
                        break;
                    case "Cooldown":
                        cdHandler.go(effect, firebot)
                        break;
                    case "Celebration":
                        celebration.play(effect);
                        break;
                    case "Dice":
                        diceHandler.send(effect, participant);
                        break;
                    case "Game Control":
                        controlHandler.press('mousedown', effect, control);
                        break;
                    case "HTML":
                        htmlHandler.show(effect);
                        break;
                    case "Play Sound":
                        media.play(effect);
                        break;
                    case "Show Image":
                        media.show(effect);
                        break;
                    case "Custom Script":
                        try {
                          customScriptHandler.processScript(effect.scriptName, control.controlId, username);
                        } catch(err) {
                          renderWindow.webContents.send('error', "Oops! There was an error processing the custom script.");
                        }
                        break;
                    default:
                        renderWindow.webContents.send('error', "Oops! This effect type doesnt exist: "+effectType);
                        console.log('Oops! This effect type doesnt exist: '+effectType);
                }
            }

            // Throw this information into the moderation panel.
            renderWindow.webContents.send('eventlog', {username: participant.username, event: "pressed the "+controlID+" button."});

            // Charge sparks for the button that was pressed.
            if (inputEvent.transactionID) {
                // This will charge the user.
                mixerInteractive.sparkTransaction(inputEvent.transactionID);
            };

        }) // end cooldown function
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
            case "Change Group":
                console.log('Change Group doesnt work with manual trigger.');
                break;
            case "Change Scene":
                console.log('Change Scene doesnt work with manual trigger.');
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
            case "Dice":
                diceHandler.send(effect, {username: 'Streamer'});
                break;
            case "Game Control":
                controlHandler.press('mousedown', effect);
                controlHandler.press('mouseup', effect);
                break;
            case "HTML":
                htmlHandler.show(effect);
                break;
            case "Play Sound":
                media.play(effect);
                break;
            case "Show Image":
                media.show(effect);
                break;
            case "Custom Script":
                try {
                  customScriptHandler.processScript(effect.scriptName, control.controlId, "Test Username");
                } catch(err) {
                  renderWindow.webContents.send('error', "Oops! There was an error processing the custom script.");
                }
                break;
            default:
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

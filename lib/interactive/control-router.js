const {ipcMain, BrowserWindow, dialog} = require('electron');
const mixerInteractive = require('../common/mixer-interactive');
const cooldown = require('./cooldowns.js');
const dataAccess = require('../common/data-access.js');
const sparkExemptManager = require('./helpers/sparkExemptManager.js')

// Handlers
const controlHandler = require('../common/handlers/game-controls/controlProcessor.js');
const effectRunner = require('../common/effect-runner.js');

// Control Router
// This function takes in every button press and routes the info to the right destination.
function controlRouter(mouseevent, mixerControls, mixerControl, gameJson, inputEvent, participant) {
    var controlID = inputEvent.input.controlID;
    var firebot = gameJson.firebot;
    var control = firebot.controls[controlID];

    if(control.effects != null){
        var effects = control.effects;
    } else {
        var effects = [];
    }

    var username = "";
    if(participant) {
      username = participant.username;
    }

    // Create request wrapper (instead of having to pass in a ton of args)
    var processEffectsRequest = {
        type: "interactive",
        effects: effects,
        firebot: firebot,
        participant: participant,
        control: control,
        isManual: false
    } 

    // Check to see if this is a mouse down or mouse up event.
    if(mouseevent == "mousedown"){
        // Mouse Down event called.

        // Make sure cooldown is processed.
        cooldown.router(mixerControls, mixerControl, firebot, control)
        .then((res) =>{
            // Process effects.
            autoPlay(processEffectsRequest)

            // Charge sparks for the button that was pressed.
            if (inputEvent.transactionID) {
                // This will charge the user.
                if(!sparkExemptManager.userIsExempt(participant.username, participant.groupID)) {
                  mixerInteractive.sparkTransaction(inputEvent.transactionID);
                }              
            };

            // Throw this button info into UI log.
            if(control.skipLog !== true){
                renderWindow.webContents.send('eventlog', {username: participant.username, event: "pressed the "+controlID+" button."});
            }
        })
        .catch((err) => {
            console.log('Button is still on cooldown. Ignoring button press.');

            // Throw this button info into UI log.
            if(control.skipLog !== true){
                renderWindow.webContents.send('eventlog', {username: participant.username, event: "tried to press "+controlID+" but it is on cooldown."});
            }
        })

    } else {
        // Mouse up event called. 
        // Right now this is only used by game controls to know when to lift keys up.

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

// Auto Play
// This function will activate a button when triggered through mixer..
function autoPlay(processEffectsRequest){
    // Run the effects
    effectRunner.processEffects(processEffectsRequest)
    .then(function() {
        // This is called after the effects are done running. 
    });
}

// Manual Play
// This function will active a button when it is manually triggered via the ui.
function manualPlay(controlID){

    // Get current controls board and set vars.
    try{
        var interactiveCache = mixerInteractive.getInteractiveCache();
        var controls = interactiveCache['firebot'].controls;
        var control = controls[controlID];
    } catch(err){
        renderWindow.webContents.send('error', "There was an error trying to manually activate this button.");
        console.log(err);
        return;
    };

    var effects = control.effects;
    
    // Create request wrapper (instead of having to pass in a ton of args)
    // Make sure we specify isManual as true
    var processEffectsRequest = {
      type: 'interactive',
      effects: effects,
      firebot: null,
      participant: null,
      control: control,
      isManual: true
    }
    
    // Run the effects
    effectRunner.processEffects(processEffectsRequest)
      .then(function() {
        // This is called after the effects are done running. 
      });

    // Throw this information into the moderation panel.
    if(control.skipLog !== true){
        renderWindow.webContents.send('eventlog', {username: 'You', event: "manually pressed the "+controlID+" button."});      
    }
}

// Manually play a button.
// This listens for an event from the render and will activate a button manually.
ipcMain.on('manualButton', function(event, controlID) {
    manualPlay(controlID);
});

// Export Functions
exports.router = controlRouter;

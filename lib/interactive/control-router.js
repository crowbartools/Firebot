const beamInteractive = require('./beam-interactive');

// Handlers
const mediaHandler = require('./handlers/mediaProcessor.js');
const apiHandler = require('./handlers/apiProcessor.js');
const chatHandler = require('./handlers/chatProcessor.js');

// Control Router
// This function takes in every button press and routes the info to the right destination.
function controlRouter(gameJson, inputEvent, participant){
    var controlID = inputEvent.input.controlID;
    var firebot = gameJson.firebot;
    var control = firebot.controls[controlID];
    var effects = control.effects;

    // Log input event.
    //console.log(inputEvent);
    //console.log(participant);
    //console.log(control);

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
                console.log(effectType);
                break;
            case "Chat":
                chatHandler.send(effect);
                break;
            case "Cooldown":
                console.log(effectType);
                break;
            case "Celebration":
                console.log(effectType);
                break;
            case "Game Control":
                console.log(effectType);
                break;
            case "Play Sound":
                console.log(effectType);
                break;
            case "Show Image":
                console.log(effectType);
                break;
            default:
                console.log('Oops! This effect type doesnt exist: '+effectType);
        }
    }

    // Let's tell the user who they are, and what they pushed.
    console.log(`${participant.username} pushed the ${inputEvent.input.controlID} button. Transaction ID: ${inputEvent.transactionID}.`);

    // TODO: Cooldown Button or Buttons

    // Did this push involve a spark cost?
    if (inputEvent.transactionID) {
        // This will charge the user.
        // beamInteractive.sparkTransaction(inputEvent.transactionID);
    };
}


// Export Functions
exports.router = controlRouter;
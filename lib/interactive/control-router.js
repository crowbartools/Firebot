const beamInteractive = require('./beam-interactive');
const cooldown = require('./cooldowns.js');

// Handlers
const mediaHandler = require('./handlers/mediaProcessor.js');
const apiHandler = require('./handlers/apiProcessor.js');
const chatHandler = require('./handlers/chatProcessor.js');
const celebration = require('./handlers/celebrationProcessor.js');
const media = require('./handlers/mediaProcessor.js');

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
                console.log('Change Scene effect is not currently supported by Beam in node.');
                break;
            case "Chat":
                chatHandler.send(effect);
                break;
            case "Cooldown":
                console.log(effectType);
                break;
            case "Celebration":
                celebration.play(effect);
                break;
            case "Game Control":
                console.log(effectType);
                break;
            case "Play Sound":
                media.play(effect);
                break;
            case "Show Image":
                media.show(effect);
                break;
            default:
                console.log('Oops! This effect type doesnt exist: '+effectType);
        }
    }

    // TODO: Throw this information into the moderation panel.
    console.log(`${participant.username} pushed the ${inputEvent.input.controlID} button. Transaction ID: ${inputEvent.transactionID}.`);

    // TODO: Cooldown Button or Buttons

    // TODO: Charge sparks for the button that was pressed.
    if (inputEvent.transactionID) {
        // This will charge the user.
        // beamInteractive.sparkTransaction(inputEvent.transactionID);
    };
}


// Export Functions
exports.router = controlRouter;
const cooldown = require('../cooldowns.js');

// Cooldown Processor
// Gets the cooldown info of the button and then sends it off to cool them all down.
function cooldownProcessor(effect, firebot){
    var cooldownButtons = effect.buttons;
    var cooldownLength = parseInt( effect['length'] ) * 1000;

    cooldown.group(cooldownButtons, cooldownLength, firebot)
}


// Export Functions
exports.go = cooldownProcessor;
const mixerCooldown = require('../../interactive/cooldowns.js');

// Cooldown Processor
// Gets the cooldown info of the button and then sends it off to cool them all down.
function cooldownProcessor(effect, firebot){
    var buttons = effect.buttons;
    var cooldown = parseInt( effect['length'] ) * 1000;

    mixerCooldown.group(buttons, cooldown, firebot)
}


// Export Functions
exports.go = cooldownProcessor;
const cooldown = require('../cooldowns.js');

// Cooldown Processor
// Gets the cooldown info of the button and then sends it off to cool them all down.
function cooldownProcessor(mixerControls, mixerControl, effect){
    var cooldownButtons = effect.buttons;
    var cooldownLength = parseInt( effect['length'] ) * 1000;

    cooldown.group(cooldownButtons, cooldownLength, mixerControls)
}


// Export Functions
exports.go = cooldownProcessor;
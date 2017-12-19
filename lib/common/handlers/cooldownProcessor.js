'use strict';

const mixerCooldown = require('../../interactive/cooldowns.js');

// Cooldown Processor
// Gets the cooldown info of the button and then sends it off to cool them all down.
function cooldownProcessor(effect, firebot) {
    let buttons = effect.buttons;
    let cooldown = parseInt(effect['length']);

    mixerCooldown.group(buttons, cooldown, firebot);
}


// Export Functions
exports.go = cooldownProcessor;

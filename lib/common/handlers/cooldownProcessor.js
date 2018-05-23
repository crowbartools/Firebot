'use strict';

const mixerCooldown = require('../../interactive/cooldowns.js');
const interactive = require('../mixer-interactive');

// Cooldown Processor
// Gets the cooldown info of the button and then sends it off to cool them all down.
function cooldownProcessor(effect) {
    let buttons = effect.buttons;
    let cooldown = parseInt(effect.length);

    mixerCooldown.group(buttons, cooldown, interactive.getInteractiveCache().firebot, effect.neverOverride);
}


// Export Functions
exports.go = cooldownProcessor;

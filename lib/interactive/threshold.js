'use strict';
const mixerInteractive = require('../common/mixer-interactive.js');

// This var will save the threshhold status of all buttons.
let thresholdSaved = [];

// Progress Calculator
function progressCalc(thresholdSaved, threshold) {
    let progress = thresholdSaved / threshold;
    return progress;
}

// Handles all threshold requests
function thresholdRouter(control) {

    return new Promise((resolve, reject) => {

        let buttonId = control.controlId,
            savedThreshold = thresholdSaved[buttonId],
            controlThreshold = parseInt(control.threshold);

        // Check to see if we have a control threshold saved for the control, if not we can just bypass everything.
        if (controlThreshold !== 0 && controlThreshold !== null && controlThreshold !== undefined) {

            // Check to see if we have a saved value to compare against, or if this is our first time hitting this control.
            if (savedThreshold !== null && savedThreshold !== undefined) {
                if (savedThreshold >= controlThreshold) {
                    // We've passed the threshold
                    thresholdSaved[buttonId] = 0;
                    mixerInteractive.progressUpdate(buttonId, 0);
                    resolve(true);
                } else {
                    // We're still trying to hit the threshold.
                    thresholdSaved[buttonId] = thresholdSaved[buttonId] + 1;
                    mixerInteractive.progressUpdate(buttonId, progressCalc(thresholdSaved[buttonId], controlThreshold));
                    reject(false);
                }
            } else {
                // We've not pushed any info to our saved thresholds yet. First time clicking the button.
                if (controlThreshold === 1) {
                    // Threshold is just set at one. So the user probably meant for it to fire on each click.
                    resolve(true);
                } else {
                    // Threshold is set at more than one, so lets put in our first saved value.
                    thresholdSaved[buttonId] = 1;
                    mixerInteractive.progressUpdate(buttonId, progressCalc(thresholdSaved[buttonId], controlThreshold));
                    reject(false);
                }
            }

        } else {
            // No threshold is set for this button. Go ahead and run it!
            resolve(true);
        }
    });
}

// Clear Threshold
function clearThreshold() {
    thresholdSaved = [];
}

// Exports
exports.router = thresholdRouter;
exports.reset = clearThreshold;
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

        // If savedThreshold is undefined, this is the first time the button was pressed. So, default it to 0.
        if (Object.is(savedThreshold, undefined)) {
            savedThreshold = 0;
        }

        // Check to see if we have a control threshold saved for the control, if not we can just bypass everything.
        if (controlThreshold !== 0 && controlThreshold !== 1 && controlThreshold != null && isNaN(controlThreshold) === false) {

            // Check to see if we have a saved value to compare against, or if this is our first time hitting this control.
            if (savedThreshold !== null && savedThreshold !== undefined) {
                // Incremiment our count by one.
                thresholdSaved[buttonId] = savedThreshold + 1;

                // Test to see if our saved value is higher than our threshold.
                if (thresholdSaved[buttonId] >= controlThreshold) {
                    // We've passed the threshold
                    // Reset everything and resolve.
                    thresholdSaved[buttonId] = 0;
                    mixerInteractive.progressUpdate(buttonId, 0);
                    resolve(true);
                } else {
                    // We're still trying to hit the threshold.
                    // Pass our newest progress numbers to mixer.
                    mixerInteractive.progressUpdate(buttonId, progressCalc(thresholdSaved[buttonId], controlThreshold));
                    reject(false);
                }

            }
        } else {
            // We either don't need to test, or threshold is set to one. In which case it'd run every click anyway.
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
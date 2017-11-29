'use strict';

const dataAccess = require('../common/data-access.js');
const mixerInteractive = require('../common/mixer-interactive.js');

// This var will save the cooldown status of all buttons.
let cooldownSaved = [];

// Cooldown Checker
// This function checks to see if a button should be cooled down or not based on current cooldown count.
// It will return true if the new cooldown is longer than what it was already.
function cooldownChecker(buttonID, cooldown) {
    // Get current time in milliseconds
    let dateNow = Date.now();

    // Add cooldown amount to current time. Save to var newTime.
    let newTime = dateNow + cooldown;

    // Go look into cooldownSaved for this button. Save to var oldTime.
    let oldTime = cooldownSaved[buttonID];

    // If new time is bigger than oldTime resolve true, else false.
    if (oldTime === undefined || newTime > oldTime) {
        // Push new value and resolve.
        cooldownSaved[buttonID] = newTime;
        return true;
    }
    // Keep old time.
    return false;

}

// Group Cooldown
// Buttons should be an array of controlIDs that should be cooled down.
function groupCooldown(buttons, cooldown, firebot) {
    // Loop through and find button to cool down.
    buttons.forEach(button => {
        if (cooldownChecker(button, cooldown) === true) {
            let buttonJson = firebot.controls[button];
            mixerInteractive
                .returnButton(button, buttonJson.scene)
                .then((control) => {
                    console.log('Cooling Down (Group): ' + control.controlID + ' for ' + cooldown);
                    control.update({cooldown: cooldown});
                });
        }
    });
}

// Cooldown Expire Checker
// This function checks to see if the saved time has expired or not.
// Will return true if expired, and false if not yet expired.
function cooldownExpireChecker(buttonID) {
    // Go look into cooldownSaved for this button
    let savedTime = cooldownSaved[buttonID];

    // If new time is bigger than oldTime resolve true, else false.
    return savedTime === undefined || Date.now() > savedTime;
}

// Cooldown Router
function cooldownRouter(mixerControls, mixerControl, firebot, control) {

    return new Promise((resolve, reject) => {

        let expired = cooldownExpireChecker(control.controlId);
        let cooldown;

        // Alright, this button is no longer on cooldown and ready to be pressed.
        if (expired === true) {
            cooldown = control.cooldown;
            let groupName = control.cooldownGroup;

            if (groupName !== undefined && groupName !== "") {
                // This button has a cooldown group... so it's time to cool them all down.
                let groupsJson = firebot.cooldownGroups[groupName];

                try {
                    // This will error out if the cooldown group this button is assigned to no longer exists.
                    let buttons = groupsJson.buttons;
                    cooldown = parseInt(groupsJson['length']) * 1000;

                    // For each button in the cooldown group...
                    groupCooldown(buttons, cooldown, firebot);

                    // Button cooldown process complete.
                    resolve(true);

                } catch (err) {
                    // This cooldown group was deleted. Fix this control.
                    let dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
                    let gameName = dbSettings.getData('/interactive/lastBoardId');
                    let dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/" + gameName);
                    dbControls.delete('./firebot/controls/' + control.controlId + '/cooldownGroup');

                    // Let's check to see if this one button needs to cool down then...
                    if (cooldown !== undefined && cooldown > 0) {
                        cooldown = parseInt(control.cooldown) * 1000;
                        let cooldownCheck = cooldownChecker(control.controlId, cooldown);
                        if (cooldownCheck === true) {
                            console.log('Cooling Down (Single): ' + control.controlId + ' for ' + cooldown);
                            control.update({cooldown: cooldown});
                        }
                    }

                    // Button cooldown process complete.
                    resolve(true);
                }

            } else {
                // Button doesn't have a cooldown group, so let's just cool down this one button.

                // If cooldown is not listed or zero, then don't do anything.
                if (cooldown !== undefined && cooldown > 0) {
                    cooldown = parseInt(control.cooldown) * 1000;
                    let cooldownCheck = cooldownChecker(control.controlId, cooldown);
                    if (cooldownCheck === true) {
                        console.log('Cooling Down (Single): ' + control.controlId + ' for ' + cooldown);
                        mixerControl.update({cooldown: cooldown});
                    }
                }

                // Button cooldown process complete.
                resolve(true);
            }
        } else {
            // This button is still on cooldown! Don't press it again.
            console.log('Button ' + control.controlID + ' is still on cooldown. Ignoring press.');
            reject(false);
        }
    });
}

// Return Cooldowns
function returnCooldowns() {
    return cooldownSaved;
}

// Clear Cooldowns
function clearCooldowns() {
    cooldownSaved = [];
}

// Exports
exports.cooldowns = returnCooldowns;
exports.reset = clearCooldowns;
exports.router = cooldownRouter;
exports.group = groupCooldown;
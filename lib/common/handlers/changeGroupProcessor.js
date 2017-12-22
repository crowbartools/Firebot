'use strict';

const mixerInteractive = require('../mixer-interactive');

// Change Group
function changeGroup(effect, trigger) {

    let firebot = mixerInteractive.getInteractiveCache().firebot;
    let firebotGroupArray = [];

    // Check to see if this is a valid active group.
    let scenes = firebot.scenes;
    let groupid = effect.group;

    // Add Firebot scenes to firebot array.
    // LOOPS: array x2
    for (let scene in scenes) {
        if (scene !== null && scene !== undefined) {
            let groups = scenes[scene].default;
            for (let group in groups) {
                if (group !== null && group !== undefined) {
                    let groupID = groups[group];
                    if (groupID !== "None") {
                        firebotGroupArray.push(groupID);
                    }
                }
            }
        }
    }

    // Always push default since it always exists.
    firebotGroupArray.push('default');

    // Search group array for effect.scene and see if it exists, if it does this is valid.
    let success = firebotGroupArray.filter(function (success) {
        return success === groupid;
    })[0];

    // Okay, check to see if we found a match or not from the list of active groups.
    if (success !== undefined) {
        let participant = trigger.metadata.participant;
        // We found a group match so this is valid.
        mixerInteractive.changeGroups(participant, groupid);
    } else if (groupid !== "None") {
        // No matches, this isn't an active group.
        renderWindow.webContents.send('error', "You tried to switch people to an inactive group: " + groupid + ". To make this group active please give it a default scene on this board. Otherwise, remove this group from any change group buttons.");
    }
}

// Export Functions
exports.go = changeGroup;

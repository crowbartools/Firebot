const mixerInteractive = require('../mixer-interactive');

// Change Group
function changeGroup(participant, effect, firebot){
    var firebotGroupArray = [];

    // Check to see if this is a valid active group.
    var scenes = firebot.scenes;
    var groupid = effect.group;

    // Add Firebot scenes to firebot array.
    for (scene in scenes){
        var groups = scenes[scene].default;
        for (group in groups){
            var groupID = groups[group];
            if(groupID !== "None"){
                firebotGroupArray.push(groupID);
            }
        }
    }

    // Always push default since it always exists.
    firebotGroupArray.push('default');

    // Search group array for effect.scene and see if it exists, if it does this is valid.
    var success = firebotGroupArray.filter(function ( success ) {
        return success === groupid;
    })[0];

    // Okay, check to see if we found a match or not from the list of active groups.
    if(success !== undefined){
        // We found a group match so this is valid.
        mixerInteractive.changeGroups(participant, groupid);
    } else if (groupid !== "None") {
        // No matches, this isn't an active group.
        renderWindow.webContents.send('error', "You tried to switch people to an inactive group: "+groupid+". To make this group active please give it a default scene on this board. Otherwise, remove this group from any change group buttons.");
    }
}

// Export Functions
exports.go = changeGroup;
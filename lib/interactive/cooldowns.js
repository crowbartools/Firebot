const JsonDB = require('node-json-db');

// Cooldown Router
function cooldownRouter(mixerControls, mixerControl, firebot, control){
    var cooldown = control.cooldown;
    var groupName = control.cooldownGroup;

    if(groupName !== undefined){
        // This button has a cooldown group... so it's time to cool them all down.
        var groupsJson = firebot.cooldownGroups[groupName];
        var buttons = groupsJson.buttons;
        var cooldown = parseInt( groupsJson['length'] ) * 1000;
        
        // For each button in the cooldown group...
        groupCooldown(buttons, cooldown, mixerControls)
    } else {
        // Button doesn't have a cooldown group, so let's just cool down this one button.

        // If cooldown is not listed or zero, then don't do anything.
        if (cooldown !== undefined && cooldown > 0){
            var cooldown = parseInt(control.cooldown) * 1000;
            mixerControl.setCooldown(cooldown);
        }
    }
}

// Group Cooldown
// Buttons should be an array of controlIDs that should be cooled down.
function groupCooldown(buttons, cooldown, mixerControls){
    
    var buttonArray = buttons;

    for (var i = buttonArray.length - 1; i >= 0; i--) {
        var button = buttonArray[i];
        for (mixerControl of mixerControls){
            var controlID = mixerControl.controlID;

            // This is a matching control! Send cooldown.
            if (button == controlID){
                console.log(button, controlID);
                console.log('-------'+controlID+' is cooling down. --------')
                mixerControl.setCooldown(cooldown);

                // Remove from array.
                buttonArray.splice(i, 1);
            }
        }
    }
}

// Exports
exports.router = cooldownRouter;
exports.group = groupCooldown;
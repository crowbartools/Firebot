const JsonDB = require('node-json-db');

// Cooldown Router
function cooldownRouter(beamControls, beamControl, firebot, control){
    var cooldown = control.cooldown;
    var groupName = control.cooldownGroup;

    if(groupName !== undefined){
        // This button has a cooldown group... so it's time to cool them all down.
        var groupsJson = firebot.cooldownGroups[groupName];
        var buttons = groupsJson.buttons;
        var cooldown = parseInt( groupsJson['length'] ) * 1000;
        
        // For each button in the cooldown group...
        groupCooldown(buttons, cooldown, beamControls)
    } else {
        // Button doesn't have a cooldown group, so let's just cool down this one button.

        // If cooldown is not listed or zero, then don't do anything.
        if (cooldown !== undefined && cooldown > 0){
            var cooldown = parseInt(control.cooldown) * 1000;
            beamControl.setCooldown(cooldown);
        }
    }
}

// Group Cooldown
// Buttons should be an array of controlIDs that should be cooled down.
function groupCooldown(buttons, cooldown, beamControls){
    for (button of buttons){
        // Look through beamControls to find matching button...
        for (control of beamControls){
            var controlID = control.controlID;

            // This is a matching control! Send cooldown.
            if (button == controlID){
                control.setCooldown(cooldown);
            }
        }
    }
}

// Exports
exports.router = cooldownRouter;
exports.group = groupCooldown;
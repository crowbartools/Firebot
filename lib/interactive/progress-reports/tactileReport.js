const JsonDB = require('node-json-db');

// Tactile
function tactileProgress(tactile) {

    if(!tactile || !tactile.length) return [];

    var json = [];

    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    var activeProfile = dbSettings.getData('/interactive/activeBoard');
    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
    var controls = dbControls.getData('/');

    for (i = 0; i < tactile.length; i++) {
        var rawid = tactile[i].id;
        var holding = tactile[i].holding;
        var press = tactile[i].pressFrequency;

        var button = controls.tactile[rawid];

        if(button !== undefined){
            // Get cooldown and convert from seconds to milliseconds
            var cooldown = parseInt( button['cooldown'] ) * 1000;

            // Push cooldown to json if a button is being held or pushed.
            if (isNaN(press) === false && press > 0 || isNaN(holding) === false && holding > 0) {
                // Take cooldown list for this button and turn it into an array.
                var cooldownBuddies = button['cooldownButtons'];
                var cooldownBuddyArray = cooldownBuddies.replace(/ /g,'').split(',');

                // Loop through list of other buttons to cool down.
                if (cooldownBuddyArray.length > 0){
                    cooldownBuddyArray.forEach( function(id){
                        // If there are no cooldown buddies for some reason, stop.
                        if (id === "") return;

                        // If the button being cooled down is the one pressed then send fired. Else, don't and just cool down.
                        if (id == rawid){
                            json.push({
                                "id": parseInt(id),
                                "cooldown": cooldown,
                                "fired": true,
                                "progress": 1
                            });
                        } else {
                            json.push({
                                "id": parseInt(id),
                                "cooldown": cooldown
                            });
                        }
                    })
                }
            }

            // Resets
            if (isNaN(holding) === false && holding === 0 || isNaN(press) === false && press === 0){
                // If button isn't being held down or pressed, send a fired false to reset the effects.
                json.push({
                    "id": parseInt(rawid),
                    "fired": false,
                    "progress": 0
                })
            }
        }
    }
    return json;
}

// Module Exports
exports.update = tactileProgress;
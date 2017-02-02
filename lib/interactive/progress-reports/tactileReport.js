const JsonDB = require('node-json-db');

// Tactile
function tactileProgress(tactile) {

    // If tactile doesnt exist then stop here.
    if(!tactile || !tactile.length) return [];

    // List to build on while parsing the entire tactile report.
    var finalReport = [];

    // Get user settings
    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    var activeProfile = dbSettings.getData('/interactive/activeBoard');
    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
    var controls = dbControls.getData('/');

    // Loop through the tactile list.
    for (i = 0; i < tactile.length; i++) {
        var rawid = tactile[i].id;
        var holding = tactile[i].holding;
        var press = tactile[i].pressFrequency;

        // This button was pushed.
        if ( press > 0 || holding > 0){

            // So, get the user specific settings for it.
            var button = controls.tactile[rawid];
            var cooldownGroup = button['cooldownGroup'];

            // If cooldown is not solo, then push group progress to report.
            // Else just push single progress.
            if (cooldownGroup !== "solo"){
                var progress = controls.cooldowns[cooldownGroup].progress;

                for (a = 0; a < progress.length; a++) { 
                    finalReport.push(progress[a]);
                };
            } else {
                var cooldown = button.cooldown;
                var progress = {
                        "id": rawid,
                        "cooldown": cooldown,
                        "fired": false,
                        "progress": 0
                    };
                finalReport.push(progress);
            }
        }
    }

    // Return tactile report;
    return finalReport;
}

// Module Exports
exports.update = tactileProgress;
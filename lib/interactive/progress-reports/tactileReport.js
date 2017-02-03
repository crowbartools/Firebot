const JsonDB = require('node-json-db');

// Saves which buttons are animating from report to report.
animationSaved = []

// Tactile
function tactileProgress(tactile) {

    // If tactile doesnt exist then stop here.
    if(!tactile || !tactile.length) return [];

    // List to build on while parsing the entire tactile report.
    // Doing this lets us overwrite settings that may have been set by previous buttons in the tactile report.
    tempReport = {};

    // This will store any button id's in which that button recieved the "fired" or "progress" options.
    animationStarted = [];

    // Get user settings
    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    var activeProfile = dbSettings.getData('/interactive/activeBoard');
    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);

    // Loop through the tactile list.
    for (i = 0; i < tactile.length; i++) {
        var rawid = tactile[i].id;

        // get the user specific settings for it.
        var button = dbControls.getData('/tactile/'+rawid);
        var cooldownGroup = button['cooldownGroup'];

        // Create report based on stats so far.
        if ( tactile[i].pressFrequency > 0 && cooldownGroup !== "solo" || tactile[i].holding > 0 && cooldownGroup !== "solo"){
            // A button was pressed with a cooldown group.
            var cooldownGroup = dbControls.getData('/cooldowns/'+cooldownGroup)
            var buttonArray = cooldownGroup['buttons'];
            var cooldown = cooldownGroup['cooldown'];

            // Loop through the pre-built report in the controls file.
            for (a = 0; a < buttonArray.length; a++) {
                var buttonid = buttonArray[a];

                // This is the button that was pressed so we need to send fired.
                if(rawid === buttonid){
                    var buttonProgress = {
                        "id": buttonid,
                        "cooldown": cooldown,
                        "fired": true,
                        "progress": 1
                    };
                    // Save animation settings for next report.
                    animationStarted.push(buttonid);
                } else {
                    // This button was not pressed but is in the cooldown group.
                    var buttonProgress = {
                        "id": buttonid,
                        "cooldown": cooldown,
                        "fired": false,
                        "progress": 0
                    };
                }
                // Push to tempReport.
                if(buttonProgress !== undefined){
                    tempReport[buttonid] = buttonProgress;
                }
            };
        } else if (tactile[i].pressFrequency > 0 || tactile[i].holding > 0){
            // Button was pressed, but doesn't have a cooldown group.
            var cooldown = button.cooldown;
            var buttonProgress = {
                    "id": rawid,
                    "cooldown": cooldown,
                    "fired": true,
                    "progress": 1
                };
            // Save animation settings.
            animationStarted.push(rawid);
            // Push to temp report.
            tempReport[rawid] = buttonProgress;
        } else {
            // Button not pressed
            var savedReport = tempReport[rawid];

            // Loop through animations from last report.
            // Stop as soon as we find the button we're currently looking for...
            var didAnimate = false;
            for (d = 0; d < animationSaved.length; d++) {
                if(rawid == animationSaved[d]){
                    // Yes it did animate!
                    didAnimate = true;

                    // Remove it from the array.
                    var index = animationSaved.indexOf(rawid);
                    if (index > -1) {
                       animationSaved.splice(index, 1);
                    }

                    // Break the loop and go to send progress report.
                    break;
                }
            }

            // If the buttons fate hasnt been determined by cooldown group and it is animating due to the last report.
            // Then send over an animation reset packet.
            if(savedReport === undefined && didAnimate === true){
                // Make a reset packet.
                var buttonProgress = {
                    "id": rawid,
                    "fired": false,
                    "progress": 0
                };
                // Push to temp report.
                tempReport[rawid] = buttonProgress;
            }
        }
    }

    // Done! Push animationStarted to animationSaved.
    // This lets the next report know which buttons are currently animating.
    animationSaved = animationStarted;

    // Compile the final report.
    // This takes apart temp report and pushes each piece to the final report.
    finalReport = [];
    for (var item in tempReport) {
        var report = tempReport[item];
        finalReport.push(report);
    }

    // Return tactile report;
    return finalReport;
}


// Module Exports
exports.update = tactileProgress;
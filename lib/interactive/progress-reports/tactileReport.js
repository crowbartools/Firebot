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
    for (var i in tactile) {
        var rawid = tactile[i].id;

        // get the user specific settings for it.
        var button = dbControls.getData('/tactile/'+rawid);
        var cooldownGroup = button['cooldownGroup'];

        // Create report based on stats so far.
        // This checks if button was pushed or not, and if so was it in a cooldown group or not.
        if(tactile[i].pressFrequency === 0 && tactile[i].holding === null || tactile[i].pressFrequency === null && tactile[i].holding === 0){
            // Button not pressed
            var savedReport = tempReport[rawid];

            // Loop through animations from last report.
            // Stop as soon as we find the button we're currently looking for...
            for (var i in animationSaved) {
                if(rawid == animationSaved[i]){
                    // Yes it did animate last time around. Let's reset it!

                    // Make a reset packet.
                    var buttonProgress = buttonBuilder(rawid, 0, false, 0);

                    // Push to temp report.
                    tempReport[rawid] = buttonProgress;

                    // Remove this one from the animation array.
                    var index = animationSaved.indexOf(rawid);
                    if (index > -1) {
                       animationSaved.splice(index, 1);
                    }

                    // Break the loop because we're done here.
                    break;
                }
            }
        } else if ( tactile[i].pressFrequency > 0 && cooldownGroup !== "solo" || tactile[i].holding > 0 && cooldownGroup !== "solo"){
            // A button was pressed with a cooldown group.
            var cooldownGroup = dbControls.getData('/cooldowns/'+cooldownGroup)
            var buttonArray = cooldownGroup['buttons'];
            var cooldown = cooldownGroup['cooldown'];

            // Loop through the cooldown group buttons in the controls file.
            for (var item in buttonArray) {
                var buttonid = buttonArray[item];

                // If this was the button pressed, send fired. Else just send cooldown.
                switch(rawid === buttonid){
                    case true:
                        var buttonProgress = buttonBuilder(buttonid, cooldown, true, 1);
                        animationStarted.push(buttonid);
                    break;
                    default:
                        // This button was not pressed but is in the cooldown group.
                        var buttonProgress = buttonBuilder(buttonid, cooldown, false, 0);
                    break;
                }

                // Push to tempReport.
                tempReport[buttonid] = buttonProgress;
            };
        } else if (tactile[i].pressFrequency > 0 || tactile[i].holding > 0){
            // Button was pressed, but doesn't have a cooldown group.
            var cooldown = button.cooldown;
            var buttonProgress = buttonBuilder(rawid, cooldown, true, 1);

            // Save animation settings.
            animationStarted.push(rawid);
            
            // Push to temp report.
            tempReport[rawid] = buttonProgress;
        }
    }

    // Done! Push animationStarted to animationSaved.
    // This lets the next report know which buttons are currently animating.
    animationSaved = animationStarted;

    // Return tactile report;
    return compileReport(tempReport);
}

// Button Builder
// This takes some info and builds a progress report for a button.
function buttonBuilder(id, cooldown, fired, progress){
    switch(cooldown !== 0){
        case true:
            // This button has a cooldown.
            var buttonProgress = {
                                "id": id,
                                "cooldown": cooldown,
                                "fired": fired,
                                "progress": progress
                            };
            break;

        case false:
            // This button doesnt have a cooldown.
            var buttonProgress = {
                                "id": id,
                                "fired": fired,
                                "progress": progress
                            };
            break;
    }
    return buttonProgress;
}

// Compile Report 
function compileReport(tempReport){
    finalReport = [];
    for (var i in tempReport) {
        finalReport.push( tempReport[i] );
    }
    return finalReport;
}


// Module Exports
exports.update = tactileProgress;
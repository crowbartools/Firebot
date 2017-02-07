const JsonDB = require('node-json-db');

// Saves which buttons are animating from report to report.
cooldownSaved = [];

// Tactile
function tactileProgress(tactile) {

    // If tactile doesnt exist then stop here.
    if(!tactile || !tactile.length) return [];

    // List to build on while parsing the entire tactile report.
    // Doing this lets us overwrite settings that may have been set by previous buttons in the tactile report.
    tempReport = {};

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

            // Check to see if we've already saved info for this button to the temp report.
            if(savedReport === undefined){
                // Check to see if it is still on cooldown.
                var cooldown = cooldownChecker(rawid);
                var fired = animationFired(rawid);
                var disabled = animationDisabled(rawid);

                if(fired){
                    // It is animating

                    // Make a reset packet.
                    var buttonProgress = buttonBuilder(rawid, 0, false, 0, true);

                    // Push to temp report.
                    tempReport[rawid] = buttonProgress;
                } else if (cooldown === false && disabled === true){
                    // Make a reset packet.
                    var buttonProgress = buttonBuilder(rawid, 0, false, 0, false);

                    // Push to temp report.
                    tempReport[rawid] = buttonProgress;
                }
            }
        } else if ( tactile[i].pressFrequency > 0 && cooldownGroup !== "solo" || tactile[i].holding > 0 && cooldownGroup !== "solo"){
            // If the button is on cooldown skip to the next one in this report.
            if(cooldownChecker(rawid)){
                continue;
            }
            
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
                        var buttonProgress = buttonBuilder(buttonid, cooldown, true, 1, true);

                        // Save cooldown settings.
                        cooldownSaver(buttonid, cooldown);
                    break;
                    default:
                        // This button was not pressed but is in the cooldown group.
                        var buttonProgress = buttonBuilder(buttonid, cooldown, false, 0, true);

                        // Save cooldown settings.
                        cooldownSaver(buttonid, cooldown);
                    break;
                }

                // Push to tempReport.
                tempReport[buttonid] = buttonProgress;
            };
        } else if (tactile[i].pressFrequency > 0 || tactile[i].holding > 0){
            // If the button is on cooldown skip to the next one in this report.
            if(cooldownChecker(rawid)){
                continue;
            }

            // Button was pressed, but doesn't have a cooldown group.
            var cooldown = button.cooldown;

            // If cooldown not zero, send a packet with disabled. Otherwise, you don't want to cool it down at all.
            if(cooldown !== 0){
                var buttonProgress = buttonBuilder(rawid, cooldown, true, 1, true);

                // Save cooldown settings.
                cooldownSaver(rawid, cooldown);
            } else {
                var buttonProgress = buttonBuilder(rawid, cooldown, true, 1, false);
            }
            
            // Push to temp report.
            tempReport[rawid] = buttonProgress;
        }
    }

    // Return tactile report;
    return compileReport(tempReport);
}

// Button Builder
// This takes some info and builds a progress report for a button.
function buttonBuilder(id, cooldown, fired, progress, disabled){
    switch(cooldown !== 0){
        case true:
            // This button has a cooldown.
            var buttonProgress = {
                                "id": id,
                                "cooldown": cooldown,
                                "fired": fired,
                                "progress": progress,
                                "disabled": disabled
                            };
            break;

        case false:
            // This button doesnt have a cooldown.
            var buttonProgress = {
                                "id": id,
                                "fired": fired,
                                "progress": progress,
                                "disabled": disabled
                            };
            break;
    }

    // Save animation state for next report.
    animationFired[id] = fired;
    animationDisabled[id] = disabled;

    return buttonProgress;
}

// Animation Fired Checker
// This function checks to see if the "fired" animation is playing.
function animationFired(buttonid){
    var status = animationFired[buttonid];
    return status;
}

// Animation Disabled Checker
// This function checks to see if the "disabled" animation is playing.
function animationDisabled(buttonid){
    var status = animationDisabled[buttonid];
    return status;
}

// Cooldown Saver 
// This function saves the cooldown to the saved cooldown array and starts a timer.
function cooldownSaver(buttonid, timer){
    cooldownSaved[buttonid] = true;
    setTimeout(function(){ 
        cooldownSaved[buttonid] = false;
    }, timer + 750);
}

// Cooldown Checker
// This checks to see if a button is on cooldown or not.
// Will be true or false.
function cooldownChecker(buttonid){
    var cooldown = cooldownSaved[buttonid];
    return cooldown;
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
exports.check = cooldownChecker;
const JsonDB = require('node-json-db');

// Report Handler
function reportHandler(report) {
    var dbSettings = new JsonDB("./user-settings/settings", true, false);
    var activeProfile = dbSettings.getData("/interactive/activeBoard");

    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
	var controls = dbControls.getData('/');

    var tactileReport = report.tactile;

    // Handle tactile buttons
    for (i = 0; i < tactileReport.length; i++) {
        // Get Button Settings for ID
        var buttonReport = tactileReport[i];
        var rawid = buttonReport.id;
        var button = controls.tactile[rawid];
        var buttonType = button.type;

        if (button !== undefined && button !== null) {
            // Button exists on controls board. Route it to the appropriate processor.
            
            if(buttonType == "Game Controls"){
                // This button is a game control button.
                // Send full report for button.
                console.log('game control button exists');
            }

        } else {
            // Error button doesnt exist in controls.
            // Should we shut down interactive or just try to guess the nearest thing?
            console.log('Button doesnt exist on board.');
        }
    }
}


// Export Functions
exports.reportHandler = reportHandler;
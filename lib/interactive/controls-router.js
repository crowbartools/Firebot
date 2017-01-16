const JsonDB = require('node-json-db');

// Report Handler
function reportHandler(report) {
    var activeProfile = $('.interactive-board-select').val();

    var dbControls = new JsonDB('./controls/' + activeProfile, true, false);
	var controls = dbControls.getData('/');

    for (i = 0; i < report.length; i++) {
        // Get Button Settings for ID
        var rawid = report[i].id;
        var button = controls.tactile[rawid];
        var buttonType = button.type;

        if (button !== undefined && button !== null) {
            // Button exists on controls board. Route it to the appropriate processor.
            
            if(buttonType == "Game Controls"){
                // This button is a game control button.
                console.log('game control button pushed!');
            }

        } else {
            // Error button doesnt exist in controls.
            // Should we shut down interactive or just try to guess the nearest thing?
        }
    }
}


// Export Functions
exports.reportHandler = reportHandler;
const JsonDB = require('node-json-db');

// Game Control Processors
const gameTactile = require('./game-controls/tactile/tactileProcessor.js');
const gameScreen = require('./game-controls/screen/screenProcessor.js');
const gameJoystick = require('./game-controls/joystick/joystickProcessor.js');

// Report Handler
// This takes a beam report and pulls it apart to send the pieces on to be processed.
function reportHandler(report) {
    var dbSettings = new JsonDB("./user-settings/settings", true, false);
    var activeProfile = dbSettings.getData("/interactive/activeBoard");

    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
	var controls = dbControls.getData('/');

    var userReport = report.users;
    var tactileReport = report.tactile;
    var joystickReport = report.joystick;
    var screenReport = report.screen;

    // Handle User Report
    // This will send user info off such as how many users are connected.
    if (userReport.length > 0) {
        //TODO: Send user info on to user handler.
    }

    // Handle Tactile Report
    // Check to see if button exists in the board json file, and if it does then it gets routed based on the button type to the appropriate processor.
    for (i = 0; i < tactileReport.length; i++) {
        // Get Button Settings for ID
        var buttonReport = tactileReport[i];
        var rawid = buttonReport.id;
        var button = controls.tactile[rawid];
        var buttonType = button.type;

        // Check if button exists in board json
        if (button !== undefined && button !== null) {
            
            if(buttonType == "Game Controls"){
                gameTactile.tactile(buttonReport);
            }

        } else {
            // Error: button doesnt exist in controls.
            console.log('Button doesnt exist on board.');
        }
    }

    // Handle Joystick Report
    // Right now all joystick controls are treated as game controls and move the mouse.
    for (i = 0; i < joystickReport.length; i++) {
        gameJoystick.joystick(joystickReport[i]);
    }

    // Handle Screen Report
    // Right now all screen controls are treated as game controls and move the mouse.
    for (i = 0; i < screenReport.length; i++) {
        gameScreen.screen(screenReport[i]);
    }
}


// Export Functions
exports.reportHandler = reportHandler;
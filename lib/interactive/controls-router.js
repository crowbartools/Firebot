const JsonDB = require('node-json-db');

// Game Control Processors
const gameTactile = require('./game-controls/tactile/tactileProcessor.js');
const gameScreen = require('./game-controls/screen/screenProcessor.js');
const gameJoystick = require('./game-controls/joystick/joystickProcessor.js');

// Soundboard Processor 
const soundBoard = require('./soundboard/soundProcessor.js');

// Progress Processors
const progressReport = require('./progress-reports/progressProcessor.js');

// Error Log
const errorLog = require('../error-logging/error-logging.js')

// Report Handler
// This takes a beam report and pulls it apart to send the pieces on to be processed.
function reportHandler(report) {
    var dbSettings = new JsonDB("./user-settings/settings", true, false);
    var activeProfile = dbSettings.getData("/interactive/activeBoard");

    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
	var controls = dbControls.getData('/');

    // Split the report into individual pieces.
    var userReport = report.users;
    var tactileReport = report.tactile;
    var joystickReport = report.joystick;
    var screenReport = report.screen;

    // Button Saves
    // This saves out complete status for the tactile report before processing for button comparisons.
    // Mainly used for movement keys with game controls.
    gameTactile.buttonSaves(tactileReport);

    // Handle User Report
    if (userReport !== undefined && userReport !== null) {
        // TODO: Do something with the user report.
    }

    // Handle Tactile Report
    // Check to see if button exists in the board json file, and if it does then it gets routed based on the button type to the appropriate processor.
    for (i = 0; i < tactileReport.length; i++) {
        // Get Button Settings for ID
        var buttonReport = tactileReport[i];
        var rawid = buttonReport.id;
        var button = controls.tactile[rawid];
        
        // Check if button exists in board json
        if (button !== undefined && button !== null) {
            var buttonType = button.type;
            
            // Send to appropriate processor.
            // The type is based on the button type name in the main html file.
            if(buttonType == "Game Controls"){
                gameTactile.tactile(buttonReport);
            } else if (buttonType == "Sound"){
                soundBoard.play(buttonReport);
            }

        } else {
            // Error: button doesnt exist in controls.
            errorLog.log('Button '+rawid+' is not on your controls board. If it is showing, try removing and re-adding it. (reportHandler)');
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

    // Handle Progress Report
    // This takes the full report and processes it to send cooldowns and status updates back to beam.
    progressReport.update(tactileReport, screenReport, joystickReport);
}

// Export Functions
exports.reportHandler = reportHandler;
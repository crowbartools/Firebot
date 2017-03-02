const JsonDB = require('node-json-db');

// Require this so we can check tactile cooldowns.
const cooldown = require('./progress-reports/tactileReport.js');

// User Report Processor
const userReportProcessor = require('./user-report/userReportProcessor.js');

// Game Control Processors
const gameTactile = require('./game-controls/tactile/tactileProcessor.js');
const gameScreen = require('./game-controls/screen/screenProcessor.js');
const gameJoystick = require('./game-controls/joystick/joystickProcessor.js');

// Soundboard Processor 
const media = require('./media/mediaProcessor.js');

// API Processor
const apiButtons = require('./api-buttons/apiProcessor.js');

// Celebration Processor
const celebration = require('./celebration/celebrationProcessor.js');

// Text Processor
const textButtons = require('./text-buttons/textProcessor.js');

// Progress Processors
const progressReport = require('./progress-reports/progressProcessor.js');

// Error Log
const errorLog = require('../error-logging/error-logging.js')

// Report Handler
// This takes a beam report and pulls it apart to send the pieces on to be processed.
function reportHandler(report) {
    // Button Saves
    // This saves out complete status for the tactile report before processing for button comparisons.
    // Mainly used for movement keys with game controls.
    buttonSaveHandler(report.tactile);

    // Handle User Report
    userReportHandler(report.users);

    // Handle Tactile Report
    // Check to see if button exists in the board json file, and if it does then it gets routed based on the button type to the appropriate processor.
    tactileReportHandler(report.tactile);

    // Handle Joystick Report
    // Right now all joystick controls are treated as game controls and move the mouse.
    joystickReportHandler(report.joystick);

    // Handle Screen Report
    // Right now all screen controls are treated as game controls and move the mouse.
    screenReportHandler(report.screen);

    // Handle Progress Report
    // This takes the full report and processes it to send cooldowns and status updates back to beam.
    progressReportHandler(report.tactile, report.screen, report.joystick);
}

// Handle Button Saves
function buttonSaveHandler(tactileReport){
    gameTactile.buttonSaves(tactileReport);
}

// User Report Handler
function userReportHandler(userReport){
    userReportProcessor.send(userReport)
}

// Tactile Report Handler
function tactileReportHandler(tactileReport){
    var dbSettings = new JsonDB("./user-settings/settings", true, false);
    var activeProfile = dbSettings.getData("/interactive/activeBoard");

    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
	var controls = dbControls.getData('/');

    var i = tactileReport.length;
    while (i--) {
        // Get Button Settings for ID
        var buttonReport = tactileReport[i];
        var rawid = buttonReport.id;
        var holding = buttonReport.holding;
        var press = buttonReport.pressFrequency;
        var button = controls.tactile[rawid];

        // Check if button on cooldown. If so, skip it.
        if( cooldown.check(rawid) ){
            continue;
        }

        // If holding and press are both numbers it means holding and press are both checked in dev lab.
        if (typeof holding == "number" && typeof press == "number"){
            errorLog.log('Button '+rawid+' has both holding and press frequency checked in the dev lab. Please select only one. Most keys only need press frequency. (reportHandler)');
            break;
        }

        // Check if button exists in board json
        if (button !== undefined && button !== null) {
            var buttonType = button.type;
            
            // Send to appropriate processor.
            // The type is based on the button type name in the main html file.
            if (buttonType == "Game Controls"){
                gameTactile.tactile(buttonReport);
            } else if (buttonType == "Api Buttons"){
                apiButtons.play(buttonReport);
            } else if (buttonType == "Text Buttons"){
                textButtons.play(buttonReport);
            } else if (buttonType == "Celebration"){
                celebration.play(buttonReport);
            }

            // All buttons can technically have media items. So send all of them to the media processor.
            media.play(buttonReport);

        } else {
            // Error: button doesnt exist in controls.
            errorLog.log('Button '+rawid+' is not on your controls board. If it is showing, try removing and re-adding it or restart the app. (reportHandler)');
        }
    }
}

// Joystick Report Handler
function joystickReportHandler(joystickReport){
    var i = joystickReport.length;
    while (i--) {
        gameJoystick.joystick(joystickReport[i]);
    }
}

// Screen Report Handler
function screenReportHandler(screenReport){
    var i = screenReport.length;
    while (i--) {
        gameScreen.screen(screenReport[i]);
    }
}

// Progress Report Handler
function progressReportHandler(tactileReport, screenReport, joystickReport){
    progressReport.update(tactileReport, screenReport, joystickReport);
}

// Export Functions
exports.reportHandler = reportHandler;
const JsonDB = require('node-json-db');
const Packets = require('beam-interactive-node/dist/robot/packets').default;

const tactileReport = require('./tactileReport.js');
const screenReport = require('./screenReport.js');
const joystickReport = require('./joystickReport.js');

// Progress Compile
function progressUpdate(tactile, screen, joystick) {

    var progressReport = {};

    progressReport["tactile"] = tactileReport.update(tactile);
    progressReport["screen"] = screenReport.update(screen);
    progressReport["joystick"] = joystickReport.update(joystick);

    progressReport["progress"] = progressBuilder(progressReport);
	
	// Send progress update if it has any new info.
    if(progressReport["tactile"].length !== 0 || progressReport["screen"].length !== 0 || progressReport["joystick"].length !== 0){
		progressSend(progressReport);	
	}
}

// Progress Sender
function progressSend(progressReport){
	robot.send(new Packets.ProgressUpdate( progressReport["progress"] ));
}

// Progress Builder
function progressBuilder(progressReport){
    var tactileCurrent = progressReport["tactile"];
    var screenCurrent = progressReport["screen"];
    var joystickCurrent = progressReport["joystick"];

    var report = {}
    
    // Check to see if there is any data to send for each.
    if (tactileCurrent.length > 0){
        report.tactile = tactileCurrent;
    }

    if (screenCurrent.length > 0){
        report.screen = screenCurrent;
    }

    if (joystickCurrent.length > 0){
        report.joystick = joystickCurrent;
    }

    return report;
}

// Export Functions
exports.update = progressUpdate;
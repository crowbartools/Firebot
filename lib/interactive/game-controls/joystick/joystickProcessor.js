const JsonDB = require('node-json-db');
const rjs = require('robotjs');

// Joystick Controls
function joystick(report) {
    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    // Get mouse speed setting
    try{
        var mouseSpeed = parseInt( dbSettings.getData('/interactive/mouse/mouseSpeed') );
        if(isNaN(mouseSpeed) === true){
            var mouseSpeed = 50;
        }
    }catch(err){
        var mouseSpeed = 50;
    }

    // Move the mouse based on joystick feedback.
    var mouse = rjs.getMousePos();
    var mean = report.coordMean;
    if (!isNaN(mean.x) && !isNaN(mean.y)) {
        rjs.moveMouse(
            Math.round(mouse.x + mouseSpeed * mean.x),
            Math.round(mouse.y + mouseSpeed * mean.y)
        );
    }
}

exports.joystick = joystick;
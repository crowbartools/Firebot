const JsonDB = require('node-json-db');
const rjs = require('robotjs');

// Joystick Controls
function joystick(report) {
    const mouse = rjs.getMousePos();
    const mean = report.coordMean;
    if (!isNaN(mean.x) && !isNaN(mean.y)) {
        rjs.moveMouse(
            Math.round(mouse.x + 50 * mean.x),
            Math.round(mouse.y + 50 * mean.y)
        );
    }
}

exports.joystick = joystick;
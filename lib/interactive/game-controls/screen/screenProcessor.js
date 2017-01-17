const electron = require('electron');
const JsonDB = require('node-json-db');
const rjs = require('robotjs');

// Screen Controls
function screen(report) {
    const { width, height } = electron.screen.getPrimaryDisplay().size;

    var screenWidth = width;
    var screenHeight = height;
    const mean = report.coordMean;
    if (!isNaN(mean.x) && !isNaN(mean.y)) {
        rjs.moveMouse(
            Math.round(screenWidth * mean.x),
            Math.round(screenHeight * mean.y)
        );
    }
}

exports.screen = screen;
const electron = require('electron');
const JsonDB = require('node-json-db');
const rjs = require('robotjs');

// Screen Controls
function screen(report) {
    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    // Are mouse clicks enabled?
    try{
        var mouseClick = dbSettings.getData('/interactive/mouse/mouseClick');
    }catch(err){
        var mouseClick = "disabled";
    }

    // Find resolution of the computer running this app.
    const { width, height } = electron.screen.getPrimaryDisplay().size;

    // Parse the report.
    var screenWidth = width;
    var screenHeight = height;
    var mean = report.coordMean;
    var clicks = report.clicks;

    // Move the mouse if we get some info.
    if (!isNaN(mean.x) && !isNaN(mean.y)) {
        rjs.moveMouse(
            Math.round(screenWidth * mean.x),
            Math.round(screenHeight * mean.y)
        );
    }

    // Click if someone clicked and clicks are enabled in settings.
    if(!isNaN(clicks) && clicks > 0 && mouseClick == "enabled"){
        robot.mouseClick();
    }
}

exports.screen = screen;
const JsonDB = require('node-json-db');
const chat = require('../chat-connect.js');
const errorLog = require('../../error-logging/error-logging.js')

function textProcessor(report){
    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    var activeProfile = dbSettings.getData('./interactive/activeBoard');
    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
	var controls = dbControls.getData('/tactile');

    // Get report info
    var rawid = report.id;
    var holding = report.holding;
    var press = report.pressFrequency;
    var button = controls[rawid];

    if(press > 0){

        // Get user specific settings
        var buttonID = button['id'];
        var typeSettings = button['typeSettings'];
        var textLine = typeSettings['textLine'];
		var sendAs = typeSettings['sendAs'];
        var whisperTo = typeSettings['whisperTo'];

        if(whisperTo !== "" && whisperTo !== undefined && whisperTo !== null){
            // Send a whisper
            console.log('sending text', sendAs, whisperTo, textLine);
            chat.whisper(sendAs, whisperTo, textLine);
        } else {
            // Send a broadcast
            console.log('sending broadcast', sendAs, textLine);
            chat.broadcast(sendAs, textLine);
        }

    } else if (holding > 0){
        errorLog.log('Text Buttons should only have pressFrequency on in the dev lab.');
    }
}


// Export Functions
exports.play = textProcessor;
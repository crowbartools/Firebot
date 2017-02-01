const JsonDB = require('node-json-db');
const keycode = require('keycode');
const errorLogger = require('../error-logging/error-logging.js');

// Convert Beam JSON
function convertBeamJson() {
    var activeProfile = $('.interactive-board-select option:selected').val();   
    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);

    var beamJson = $('.json-import-area').val();

    try {
        var beamParsed = JSON.parse(beamJson);
        var beamTactiles = beamParsed.tactiles;
        // Cycle through and grab tactile information.
        for (var i = 0, length = beamTactiles.length; i < length; i++) {
            var button = beamTactiles[i];
            var buttonid = button.id;
            var buttonKeyNum = button.key;
            var keypress = keycode.names[buttonKeyNum];
            var buttonText = button.text;
            var movementCounter = "";
            var cooldown = button['cooldown'].press;
            var holding = button.analysis['holding'];
            var frequency = button.analysis['frequency'];

            // Check to make sure keycode module didn't blow it. If it did, just use the beam key name.
            if (keypress === undefined || keypress === null) {
                var keypress = buttonKeyNum;
            }

            // Set movement counters for commonly used movement keys if holding is active.
            if (keypress == "w" && holding === true) {
                var movementCounter = "s";
            }
            if (keypress == "s" && holding === true) {
                var movementCounter = "w";
            }
            if (keypress == "a" && holding === true) {
                var movementCounter = "d";
            }
            if (keypress == "d" && holding === true) {
                var movementCounter = "a";
            }

            // Correct what you can automatically.
            if (keypress == "ctrl") {
                var keypress = "control"
            }
            if (keypress == "page up") {
                var keypress = "pageup";
            }
            if (keypress == "page down") {
                var keypress = "pagedown";
            }
			if (keypress == "numpad 0") {
                var keypress = "numpad_0";
            }
			if (keypress == "numpad 1") {
                var keypress = "numpad_1";
            }
			if (keypress == "numpad 2") {
                var keypress = "numpad_2";
            }
			if (keypress == "numpad 3") {
                var keypress = "numpad_3";
            }
			if (keypress == "numpad 4") {
                var keypress = "numpad_4";
            }
			if (keypress == "numpad 5") {
                var keypress = "numpad_5";
            }
			if (keypress == "numpad 6") {
                var keypress = "numpad_6";
            }
			if (keypress == "numpad 7") {
                var keypress = "numpad_7";
            }
			if (keypress == "numpad 8") {
                var keypress = "numpad_8";
            }
			if (keypress == "numpad 9") {
                var keypress = "numpad_9";
            }

            console.log(keypress);

            // Push to DB if button checks out.
            if (holding === true && keypress !== undefined || frequency === true && keypress !== undefined) {
                // Assume its a game button
                dbControls.push("/tactile/" + buttonid, { "id": buttonid,"type":"Game Controls", "cooldown": cooldown, "cooldownButtons": [buttonid], "notes": buttonText, "typeSettings":{"press": keypress, "opposite": movementCounter}});
            }else if(holding === true && keypress === undefined || frequency === true && keypress === undefined){
                // Set as nothing
                dbControls.push("/tactile/" + buttonid, { "id": buttonid,"type":"Nothing", "cooldown": cooldown, "cooldownButtons": [buttonid], "notes": buttonText, "typeSettings":{}});
            } else {
                // ERROR WITH BUTTON SETUP. Button does not have holding or press frequency checked.
                // TO DO: Handle this error gracefully.
                errorLogger.log('Button #' + buttonid + ' does not have holding or frequency checked in devlab. For the button to work, one of these must be checked.');
            }
        }
    } catch (e) {
        // ERROR IN THE JSON.
        // TO DO: Handle this gracefully.
        console.log(e);
        errorLogger.log('Error: JSON is not formatted correctly. Make sure you copy/paste the entire controls JSON from the devlab.');
    }

    // Reload button list and clean up.
    $('.json-import-area').val('');
}

// Export Function
exports.convert = convertBeamJson;
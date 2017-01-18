// Joystick
function joystickProgress(joystick) {
    if(joystick !== "" && joystick !== undefined){
        var json = [];
        var joystick = joystick[0];
        var rawid = joystick.id;
        var mean = joystick.coordMean;
        var joyX = mean.x;
        var joyY = mean.y;
        if (isNaN(joyX) === true) {
            var joyX = 0;
        }
        if (isNaN(joyY) === true) {
            var joyY = 0;
        }

        var rad = Math.atan2(joyY, joyX);

        json.push({
            "id": rawid,
            "angle": rad,
            "intensity": 1
        });
        return json;  
    } else {
		return [];
	}
}

exports.update = joystickProgress;
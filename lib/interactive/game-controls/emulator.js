const JsonDB = require('node-json-db');
const robotjs = require('robotjs');
const kbmRobot = require('kbm-robot');
kbmRobot.startJar();

// Key Toggler
var keyToggle = function(key, state){
	
	// Check to see which handler to use.
	var dbSettings = new JsonDB('./user-settings/settings', true, false);
	try{
		var keyHandler = dbSettings.getData('/interactive/keyHandler');
	} catch (err){
		var keyHandler = "robotjs";
	}

    // Press for RobotJS
    if (keyHandler == "robotjs" || keyHandler === undefined){
		console.log('Robotjs: ', key,state);
        robotjs.keyToggle(key, state);
    }

    // Press for kbmRobot
    if (keyHandler == "kbm"){
        try{
			if(state == "down"){
				console.log('Kbm: ', key,state);
				kbmRobot.press(key).go();
			} else {
				console.log('Kbm: ', key,state);
				kbmRobot.release(key).go();
			} 
        } catch(err){
            console.log(err);
        }
    }
	
}

exports.keyToggle = keyToggle;
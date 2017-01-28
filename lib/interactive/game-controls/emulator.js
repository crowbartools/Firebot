const JsonDB = require('node-json-db');
const robotjs = require('robotjs');
const kbmRobot = require('kbm-robot');
const errorLog = require('../../error-logging/error-logging.js')

kbmRobot.startJar();

// Key Toggler
var keyToggle = function(key, state){
	
	// Check to see which handler to use.
	var dbSettings = new JsonDB('./user-settings/settings', true, false);
	try{
		var keyHandler = dbSettings.getData('/interactive/emulator');
	} catch (err){
		var keyHandler = "robotjs";
	}

    // Press for RobotJS
    if (keyHandler == "robotjs" || keyHandler === undefined){
		console.log('Robotjs: ', key,state);
		try{
			robotjs.keyToggle(key, state);
		 } catch(err){
            errorLog.log('Robotjs: Invalid key code specified. ('+key+')');
		}
        
    }

    // Press for kbmRobot
    if (keyHandler == "kbm"){
        try{
			if(state == "down"){
				console.log('Kbm: ', key,state);
				try{
					kbmRobot.press(key).go();
				}catch(err){
					errorLog.log('Robotjs: Invalid key code specified. ('+key+')');
				}
			} else {
				console.log('Kbm: ', key,state);
				try{
					kbmRobot.release(key).go();
				 } catch(err){
					errorLog.log('Robotjs: Invalid key code specified. ('+key+')');
				}
			} 
        } catch(err){
            errorLog.log('KBM-Robot Error in button emulator. Try switching to robotjs or restarting the app.')
        }
    }
	
}

exports.keyToggle = keyToggle;
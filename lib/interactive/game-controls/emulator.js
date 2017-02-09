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
				console.log('Kbm: ', key, state);
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

// Multikey Toggle
var multiKeyToggle = function(key, state, modifiers){
	
	// Check to see which handler to use.
	var dbSettings = new JsonDB('./user-settings/settings', true, false);
	try{
		var keyHandler = dbSettings.getData('/interactive/emulator');
	} catch (err){
		var keyHandler = "robotjs";
	}

	// Check to see how many modifiers we have...
	// This can only be alt, command (mac), control, and shift. So 3 max.
	var modLength = modifiers.length;

	if(modLength > 0 && modLength <= 3){
		// We're good to go!

		// Press for RobotJS
		if (keyHandler == "robotjs" || keyHandler === undefined){
			console.log('Robotjs Multikey: ', key, state, modifiers);
			try{
				robotjs.keyToggle(key, state, modifiers);
			} catch(err){
				errorLog.log('Robotjs Multikey: Invalid key code specified or invalid modifiers. ('+key+')');
			}
		}

		// Press for kbmRobot
		if (keyHandler == "kbm"){

			// Because of the way kbmRobot handles multiple key presses we have to build this out different
			// for each additional modifier.
			if(modLength === 1){
				// One modifier
				try{
					if(state == "down"){
						console.log('Kbm Multikey: ', key, state, modifiers);
						try{
							kbmRobot.press(modifiers[0]).press(key).go();
						}catch(err){
							errorLog.log('Kbm Multikey: Invalid key code specified or invalid modifiers. ('+key+')');
						}
					} else {
						console.log('Kbm Multikey: ', key, state, modifiers);
						try{
							kbmRobot.release(key).release(modifiers[0]).go();
						} catch(err){
							errorLog.log('Kbm Multikey: Invalid key code specified or invalid modifiers. ('+key+')');
						}
					} 
				} catch(err){
					errorLog.log('KBM-Robot Error in button emulator. Try switching to robotjs or restarting the app.')
				}

			} else if (modLength === 2){
				// Two modifiers
				try{
					if(state == "down"){
						console.log('Kbm Multikey: ', key, state, modifiers);
						try{
							kbmRobot.press(modifiers[0]).press(modifiers[1]).press(key).go();
						}catch(err){
							errorLog.log('Kbm Multikey: Invalid key code specified or invalid modifiers. ('+key+')');
						}
					} else {
						console.log('Kbm Multikey: ', key, state, modifiers);
						try{
							kbmRobot.release(key).release(modifiers[0]).release(modifiers[1]).go();
						} catch(err){
							errorLog.log('Kbm Multikey: Invalid key code specified or invalid modifiers. ('+key+')');
						}
					} 
				} catch(err){
					errorLog.log('KBM-Robot Error in button emulator. Try switching to robotjs or restarting the app.')
				}

			} else if (modLength === 3){
				// Three modifiers
				try{
					if(state == "down"){
						console.log('Kbm Multikey: ', key, state, modifiers);
						try{
							kbmRobot.press(modifiers[0]).press(modifiers[1]).press(modifiers[2]).press(key).go();
						}catch(err){
							errorLog.log('Kbm Multikey: Invalid key code specified or invalid modifiers. ('+key+')');
						}
					} else {
						console.log('Kbm Multikey: ', key, state, modifiers);
						try{
							kbmRobot.release(key).release(modifiers[0]).release(modifiers[1]).release(modifiers[2]).go();
						} catch(err){
							errorLog.log('Kbm Multikey: Invalid key code specified or invalid modifiers. ('+key+')');
						}
					} 
				} catch(err){
					errorLog.log('KBM-Robot Error in button emulator. Try switching to robotjs or restarting the app.')
				}
			}
		}
	} else if (modLength === 0){
		// Reroute to single key tap as there are no modifiers.
		// This happens if someone selected multikey type, but only put one key in it.
		keyToggle(key,state);
	} else {
		// Some type of error or too many modifiers saved.
		errorLog.log('There was an issue processing the multikey press. Try deleting and remaking the button. ('+key+')');
	}
}

exports.multiKeyToggle = multiKeyToggle;
exports.keyToggle = keyToggle;
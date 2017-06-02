const JsonDB = require('node-json-db');

// Key Translator
// This translates whatever key is sent to it to a valid key for the current handler.
var keyTranslator = function(key){
	
	// Check to see which handler to use.
	var dbSettings = new JsonDB('./user-settings/settings', true, false);
	try{
		var keyHandler = dbSettings.getData('./settings/emulation');
	} catch (err){
		var keyHandler = "Robotjs";
	}
	
	// Normalize key string
	var key = key.toLowerCase();
	
	// Check whether or not this key press should be a mouse click.
	var isMouseClick = 
		(key === "leftmouse" || key === "middlemouse" || key === "rightmouse");
	
	// Robot JS
	// Other than mouse clicks, there's currently no need to translate for robotjs. 
	// This is the default handler.
	if(keyHandler == "Robotjs" || keyHandler === null || keyHandler === undefined){
		
		switch (key){
			case "leftmouse": 
				var key = "left"
				break;
			case "middlemouse":
				var key = "middle"
				break;
			case "rightmouse":
				var key = "right";
				break;
		}
	}

	// KBM Robot
	// This translates RobotJS shortcuts to KBM shortcuts.
	if(keyHandler == "KBMRobot"){
		
		// KBM shortcuts are case sensitive. So change all to uppercase.
		var key = key.toUpperCase();

		switch (key){
			case "ESCAPE":
				var key = "ESC";
				break;
			case "CONTROL":
				var key = "CTRL";
				break;
			case "printscreen":
				var key = "PRINT_SCREEN";
				break;
			case "PAGEUP":
				var key = "PAGE_UP";
				break;
			case "PAGEDOWN":
				var key = "PAGE_DOWN";
				break;
			case "NUMPAD 0":
				var key = "KP_0";
				break;
			case "NUMPAD 1":
				var key = "KP_1";
				break;
			case "NUMPAD 2":
				var key = "KP_2";
				break;
			case "NUMPAD 3":
				var key = "KP_3";
				break;
			case "NUMPAD 4":
				var key = "KP_4";
				break;
			case "NUMPAD 5":
				var key = "KP_5";
				break;
			case "NUMPAD 6":
				var key = "KP_6";
				break;
			case "NUMPAD 7":
				var key = "KP_7";
				break;
			case "NUMPAD 8":
				var key = "KP_8";
				break;
			case "NUMPAD 9":
				var key = "KP_9";
				break;
			case "LEFTMOUSE": 
				var key = "1";
				break;
			case "MIDDLEMOUSE":
				var key = "2";
				break;
			case "RIGHTMOUSE":
				var key = "3";
				break;
		}
	}

	// Send correct key name back.
	return {key: key, emulator:keyHandler, isMouseClick: isMouseClick};
}

// Exports
exports.translate = keyTranslator;
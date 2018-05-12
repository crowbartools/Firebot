'use strict';

const dataAccess = require('../../data-access.js');

// Key Translator
// This translates whatever key is sent to it to a valid key for the current handler.
let keyTranslator = function(key) {

    // Check to see which handler to use.
    let dbSettings = dataAccess.getJsonDbInUserData('/user-settings/settings');

    let keyHandler = [];
    try {
        keyHandler = dbSettings.getData('./settings/emulation');
    } catch (err) {
        keyHandler = "Robotjs";
    }

    // Normalize key string
    key = key.toLowerCase();

    // Check whether or not this key press should be a mouse click.
    let isMouseClick =
		(key === "leftmouse" || key === "middlemouse" || key === "rightmouse");

    // Robot JS
    // Other than mouse clicks, there's currently no need to translate for robotjs.
    // This is the default handler.
    if (keyHandler === "Robotjs" || keyHandler === null || keyHandler === undefined) {

        switch (key) {
        case "leftmouse":
            key = "left";
            break;
        case "middlemouse":
            key = "middle";
            break;
        case "rightmouse":
            key = "right";
            break;
        case "option":
            key = "alt";
            break;
        }
    }

    // KBM Robot
    // This translates RobotJS shortcuts to KBM shortcuts.
    if (keyHandler === "KBMRobot") {

        // KBM shortcuts are case sensitive. So change all to uppercase.
        key = key.toUpperCase();

        switch (key) {
        case "ESCAPE":
            key = "ESC";
            break;
        case "CONTROL":
            key = "CTRL";
            break;
        case "PRINTSCREEN":
            key = "PRINT_SCREEN";
            break;
        case "PAGEUP":
            key = "PAGE_UP";
            break;
        case "PAGEDOWN":
            key = "PAGE_DOWN";
            break;
        case "NUMPAD_0":
            key = "KP_0";
            break;
        case "NUMPAD_1":
            key = "KP_1";
            break;
        case "NUMPAD_2":
            key = "KP_2";
            break;
        case "NUMPAD_3":
            key = "KP_3";
            break;
        case "NUMPAD_4":
            key = "KP_4";
            break;
        case "NUMPAD_5":
            key = "KP_5";
            break;
        case "NUMPAD_6":
            key = "KP_6";
            break;
        case "NUMPAD_7":
            key = "KP_7";
            break;
        case "NUMPAD_8":
            key = "KP_8";
            break;
        case "NUMPAD_9":
            key = "KP_9";
            break;
        case "LEFTMOUSE":
            key = "1";
            break;
        case "MIDDLEMOUSE":
            key = "2";
            break;
        case "RIGHTMOUSE":
            key = "3";
            break;
        case "AUDIO_MUTE":
            key = "VOLUME_MUTE";
            break;
        case "AUDIO_VOL_DOWN":
            key = "VOLUME_DOWN";
            break;
        case "AUDIO_VOL_UP":
            key = "VOLUME_UP";
            break;
        case "AUDIO_PLAY":
            key = "MEDIA_PLAY_PAUSE";
            break;
        case "AUDIO_STOP":
            key = "MEDIA_STOP";
            break;
        case "AUDIO_PAUSE":
            key = "MEDIA_PLAY_PAUSE";
            break;
        case "AUDIO_PREV":
            key = "MEDIA_PREV_TRACK";
            break;
        case "AUDIO_NEXT":
            key = "MEDIA_NEXT_TRACK";
            break;
        case "COMMAND":
            key = "VK_META";
            break;
        case "ALT":
        case "OPTION":
            key = "VK_ALT";
            break;
        }
    }

    // Send correct key name back.
    return {key: key, emulator: keyHandler, isMouseClick: isMouseClick};
};

// Exports
exports.translate = keyTranslator;

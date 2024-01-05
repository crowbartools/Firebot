"use strict";
const { keyboard, Key, mouse, Button } = require("@nut-tree/nut-js");
const logger = require("../../../logwrapper");

function mapNutKey(key) {
    key = key.toUpperCase();

    const isMouseClick = key === "LEFTMOUSE" || key === "MIDDLEMOUSE" || key === "RIGHTMOUSE";

    if (!isMouseClick) {
        switch (key) {
            case "CONTROL":
                key = Key.LeftControl;
                break;
            case "SHIFT":
                key = Key.LeftShift;
                break;
            case "ALT":
            case "OPTION":
                key = Key.LeftAlt;
                break;
            case "WINDOWS KEY/COMMAND":
                key = Key.LeftWin;
                break;
            case "BACKSPACE":
            case "DELETE":
            case "ENTER":
            case "SPACE":
            case "TAB":
            case "ESCAPE":
            case "UP":
            case "DOWN":
            case "LEFT":
            case "RIGHT":
            case "HOME":
            case "END":
                key = Key[key[0] + key.substring(1).toLowerCase()];
                break;
            case "PAGEUP":
                key = Key.PageUp;
                break;
            case "PAGEDOWN":
                key = Key.PageDown;
                break;
            case "PRINTSCREEN":
                key = Key.Print;
                break;
            case "NUMPAD_0":
                key = Key.NumPad0;
                break;
            case "NUMPAD_1":
                key = Key.NumPad1;
                break;
            case "NUMPAD_2":
                key = Key.NumPad2;
                break;
            case "NUMPAD_3":
                key = Key.NumPad3;
                break;
            case "NUMPAD_4":
                key = Key.NumPad4;
                break;
            case "NUMPAD_5":
                key = Key.NumPad5;
                break;
            case "NUMPAD_6":
                key = Key.NumPad6;
                break;
            case "NUMPAD_7":
                key = Key.NumPad7;
                break;
            case "NUMPAD_8":
                key = Key.NumPad8;
                break;
            case "NUMPAD_9":
                key = Key.NumPad9;
                break;
            case "NUMLOCK":
                key = Key.NumLock;
                break;
            case "1":
                key = Key.Num1;
                break;
            case "2":
                key = Key.Num2;
                break;
            case "3":
                key = Key.Num3;
                break;
            case "4":
                key = Key.Num4;
                break;
            case "5":
                key = Key.Num5;
                break;
            case "6":
                key = Key.Num6;
                break;
            case "7":
                key = Key.Num7;
                break;
            case "8":
                key = Key.Num8;
                break;
            case "9":
                key = Key.Num9;
                break;
            case "0":
                key = Key.Num0;
                break;
            case "AUDIO_MUTE":
                key = Key.AudioMute;
                break;
            case "AUDIO_VOL_DOWN":
                key = Key.AudioVolDown;
                break;
            case "AUDIO_VOL_UP":
                key = Key.AudioVolUp;
                break;
            case "AUDIO_PLAY":
                key = Key.AudioPlay;
                break;
            case "AUDIO_STOP":
                key = Key.AudioStop;
                break;
            case "AUDIO_PAUSE":
                key = Key.AudioPause;
                break;
            case "AUDIO_PREV":
                key = Key.AudioPrev;
                break;
            case "AUDIO_NEXT":
                key = Key.AudioNext;
                break;
            default:
                key = Key[key];
        }
    }

    return { key, isMouseClick };
}

/**
 *
 * @param {string} key
 * @param {Array<"Control" | "Alt" | "Shift"> | null} modifiers
 * @param {string} pressDurationRaw
 */
function emulateKeyPress(keyRaw, modifiers, pressDurationRaw) {
    const { key, isMouseClick } = mapNutKey(keyRaw);

    modifiers = modifiers ?? [];
    const nutModifiers = modifiers.map(k => mapNutKey(k).key);

    logger.info(
        `nut-js: Pressing "${keyRaw}" with modifiers: ${modifiers.join(", ")}`
    );

    const durationSecs = (parseFloat(pressDurationRaw) || 0.03);

    if (isMouseClick) {
        switch (key) {
            case "LEFTMOUSE":
                mouse.leftClick().catch((error) => {
                    logger.error("nut-js: Error doing left click", error.message);
                });
                break;
            case "RIGHTMOUSE":
                mouse.rightClick().catch((error) => {
                    logger.error("nut-js: Error doing right click", error.message);
                });
                break;
            case "MIDDLEMOUSE":
                mouse.click(Button.MIDDLE).catch((error) => {
                    logger.error("nut-js: Error doing middle click", error.message);
                });
                break;
        }

    } else {
        const combinedKeys = [...nutModifiers, key];
        keyboard.pressKey(...combinedKeys).then(() => {
            setTimeout(function() {
                keyboard.releaseKey(...combinedKeys).catch((error) => {
                    logger.error(`nut-js: Error pressing "${keyRaw}"`, error.message);
                });
            }, durationSecs * 1000);
        }).catch((error) => {
            logger.error(`nut-js: Error pressing "${keyRaw}"`, error.message);
        });
    }
}

function typeString(string) {
    if (string == null || string.length < 1) {
        return;
    }
    logger.info(`nut-js: Attempting to type string "${string}"`);

    keyboard.type(string).catch((error) => {
        logger.error("nut-js: Failed to type string", error.message);
    });
}

exports.emulateKeyPress = emulateKeyPress;
exports.typeString = typeString;
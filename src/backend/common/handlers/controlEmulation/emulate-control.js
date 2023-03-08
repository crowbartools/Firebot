"use strict";
// const robotjs = require("robotjs");
const logger = require("../../../logwrapper");

const mapKey = function(key) {

    key = key.toLowerCase();

    const isMouseClick = key === "leftmouse" || key === "middlemouse" || key === "rightmouse";

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
    case "windows key/command":
        key = "command";
        break;
    }

    return { key, isMouseClick };
};

/**
 *
 * @param {string} key
 * @param {Array<"Control" | "Alt" | "Shift"> | null} modifiers
 * @param {string} pressDurationRaw
 */
function emulateKeyPress(keyRaw, modifiers, pressDurationRaw) {

    const { key, isMouseClick } = mapKey(keyRaw);

    const modifierIds = (modifiers || []).map(k => mapKey(k).key);

    logger.info(
        `Robotjs: Pressing "${key}" with modifiers: ${modifierIds.join(", ")}`
    );

    const durationSecs = (parseFloat(pressDurationRaw) || 0.03);

    try {
        /*
        if (isMouseClick) {
            robotjs.mouseClick(key);
        } else {
            robotjs.keyToggle(key, "down", modifierIds);

            setTimeout(function() {
                robotjs.keyToggle(key, "up", modifierIds);
            }, durationSecs * 1000);
        }
        */
    } catch (error) {
        logger.error(`Robotjs: Error pressing "${key}"`, error);
    }
}

function typeString(string) {
    if (string == null || string.length < 1) {
        return;
    }

    logger.info(`Robotjs: Attempting to type string "${string}"`);
    /*
    try {
        robotjs.typeStringDelayed(string, 10000);
    } catch (error) {
        logger.error("Failed to type string", error);
    }
    */
}

exports.emulateKeyPress = emulateKeyPress;
exports.typeString = typeString;
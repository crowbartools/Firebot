'use strict';

const robotjs = require('robotjs');
const kbmRobot = require('kbm-robot');
const keyTranslator = require('./keytranslator');
const logger = require('../../../logwrapper');

kbmRobot.startJar();

// Key Tap
function keyTap(key, modifiers) {
    let keyJson = keyTranslator.translate(key);
    key = keyJson.key;
    let emulator = keyJson.emulator;
    let isMouseClick = keyJson.isMouseClick;
    let cleanModifiers = [];

    // Clean Modifiers, this takes all of the modifiers and converts them to the appropriate key for the selected emulator.
    try {
        if (modifiers !== null && modifiers !== undefined) {
            for (let modifier of modifiers) {
                if (modifier !== null && modifier !== undefined) {
                    logger.info('Translating ' + modifier);
                    let modKey = keyTranslator.translate(modifier);
                    cleanModifiers.push(modKey.key);
                }
            }
        }
    } catch (err) {
        logger.error(err);
    }


    // Check the emulator and process key.
    if (emulator === "KBMRobot") {
        // Press as KBMRobot
        try {
            logger.info('KBMRobot: Tapped ' + key + ' with modifiers ' + cleanModifiers);
            // Special check for mouse clicks
            if (isMouseClick === true) {
                kbmRobot.mouseClick(key)
                    .go();
            } else if (cleanModifiers.length === 0) {
                kbmRobot.press(key)
                    .sleep(30)
                    .release(key)
                    .go();
            } else if (cleanModifiers.length === 1) {
                kbmRobot.press(cleanModifiers[0])
                    .press(key)
                    .sleep(30)
                    .release(key)
                    .release(cleanModifiers[0])
                    .go();
            } else if (cleanModifiers.length === 2) {
                kbmRobot.press(cleanModifiers[0])
                    .press(cleanModifiers[1])
                    .press(key)
                    .sleep(30)
                    .release(key)
                    .release(cleanModifiers[0])
                    .release(cleanModifiers[1])
                    .go();
            } else if (cleanModifiers.length === 3) {
                kbmRobot.press(cleanModifiers[0])
                    .press(cleanModifiers[1])
                    .press(cleanModifiers[2])
                    .press(key)
                    .sleep(30)
                    .release(key)
                    .release(cleanModifiers[0])
                    .release(cleanModifiers[1])
                    .release(cleanModifiers[2])
                    .go();
            } else if (cleanModifiers.length === 4) {
                kbmRobot.press(cleanModifiers[0])
                    .press(cleanModifiers[1])
                    .press(cleanModifiers[2])
                    .press(cleanModifiers[3])
                    .press(key)
                    .sleep(30)
                    .release(key)
                    .release(cleanModifiers[0])
                    .release(cleanModifiers[1])
                    .release(cleanModifiers[2])
                    .release(cleanModifiers[4])
                    .go();
            }
        } catch (err) {
            logger.error(err);
            renderWindow.webContents.send('error', "There was an error trying to press button: " + key);
        }
    } else {
        // Press as robotjs.
        try {
            logger.info('Robotjs: Tapped ' + key + ' with modifiers ' + cleanModifiers);
            // Special check for mouse clicks
            if (isMouseClick === true) {
                robotjs.mouseClick(key);
            } else {
                // Key toggle seems to pick up better than keytap with most programs.
                robotjs.keyToggle(key, "down", cleanModifiers);
                setTimeout(function() {
                    robotjs.keyToggle(key, "up", cleanModifiers);
                }, 30);
            }
        } catch (err) {
            logger.error(err);
            renderWindow.webContents.send('error', "There was an error trying to press button: " + key);
        }
    }
}

// Key Holding
function keyHolding(key, state, modifiers) {
    let keyJson = keyTranslator.translate(key);
    key = keyJson.key;
    let emulator = keyJson.emulator;
    let isMouseClick = keyJson.isMouseClick;
    let cleanModifiers = [];

    // Clean Modifiers, this takes all of the modifiers and converts them to the appropriate key for the selected emulator.
    if (modifiers !== null && modifiers !== undefined) {
        for (let modifier of modifiers) {
            if (modifier !== null && modifier !== undefined) {
                let modKey = keyTranslator.translate(modifier);
                cleanModifiers.push(modKey.key);
            }
        }
    }

    // Check the emulator and process key.
    if (emulator === "KBMRobot") {
        if (state === "down") {
            try {
                logger.info('KBMRobot: Held ' + key + ' and modifiers ' + cleanModifiers);
                // Special check for mouse clicks
                if (isMouseClick === true) {
                    kbmRobot.mousePress(key)
                        .go();
                } else if (cleanModifiers.length === 0) {
                    kbmRobot.press(key)
                        .go();
                } else if (cleanModifiers.length === 1) {
                    kbmRobot.press(cleanModifiers[0])
                        .press(key)
                        .go();
                } else if (cleanModifiers.length === 2) {
                    kbmRobot.press(cleanModifiers[0])
                        .press(cleanModifiers[1])
                        .press(key)
                        .go();
                } else if (cleanModifiers.length === 3) {
                    kbmRobot.press(cleanModifiers[0])
                        .press(cleanModifiers[1])
                        .press(cleanModifiers[2])
                        .press(key)
                        .go();
                }
            } catch (err) {
                logger.error(err);
                renderWindow.webContents.send('error', "There was an error trying to press button: " + key);
            }
        } else {
            try {
                logger.info('KBMRobot: Released ' + key + ' and modifiers ' + cleanModifiers);
                // Special check for mouse clicks
                if (isMouseClick === true) {
                    kbmRobot.mouseRelease(key)
                        .go();
                } else if (cleanModifiers.length === 0) {
                    kbmRobot.release(key)
                        .go();
                } else if (cleanModifiers.length === 1) {
                    kbmRobot.release(key)
                        .release(cleanModifiers[0])
                        .go();
                } else if (cleanModifiers.length === 2) {
                    kbmRobot.release(key)
                        .release(cleanModifiers[0])
                        .release(cleanModifiers[1])
                        .go();
                } else if (cleanModifiers.length === 3) {
                    kbmRobot.release(key)
                        .release(cleanModifiers[0])
                        .release(cleanModifiers[1])
                        .release(cleanModifiers[2])
                        .go();
                }
            } catch (err) {
                logger.error(err);
                renderWindow.webContents.send('error', "There was an error trying to press button: " + key);
            }
        }
    } else {
        try {
            logger.info('Robotjs: Toggled ' + key + ' ' + state + '.');
            // Special check for mouse clicks
            if (isMouseClick === true) {
                // Oddly, the key and state args are reversed compared to the
                // the keyToggle call
                robotjs.mouseToggle(state, key);
            } else {
                robotjs.keyToggle(key, state, cleanModifiers);
            }

        } catch (err) {
            logger.error(err);
            renderWindow.webContents.send('error', "There was an error trying to press button: " + key);
        }
    }
}

// Exports
exports.tap = keyTap;
exports.hold = keyHolding;

"use strict";

const fileOpenHelpers = require("../../file-open-helpers");

/**
 * @param {Electron.Event} event
 * @param {string[]} argv
 */
exports.secondInstance = (_, argv) => {
    // Someone tried to run a second instance, we should focus our window.
    const logger = require("../../../logwrapper");
    try {
        logger.info("Second instance detected, focusing main window. [REMOVE LATER]");
        const { mainWindow } = require("../window-management");
        if (mainWindow) {
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();

            fileOpenHelpers.checkForFirebotSetupPath(argv);
        }
    } catch (error) {
        logger.info("Error focusing [REMOVE LATER]", error);
        // something has gone terribly wrong with this instance,
        // attempt restart
        const { restartApp } = require("../app-helpers");
        restartApp();
    }
};
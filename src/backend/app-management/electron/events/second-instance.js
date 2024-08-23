"use strict";

const fileOpenHelpers = require("../../file-open-helpers");
const { openUrl } = require("./open-url");

/**
 * @param {Electron.Event} event
 * @param {string[]} argv
 */
exports.secondInstance = (event, argv) => {
    // Someone tried to run a second instance, we should focus our window.
    const logger = require("../../../logwrapper");
    try {
        logger.debug("Second instance detected, focusing main window.");
        const { mainWindow } = require("../window-management");
        if (mainWindow) {
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();


            fileOpenHelpers.checkForFirebotSetupPathInArgs(argv);

            openUrl(event, argv.pop());
        }
    } catch (error) {
        logger.debug("Error focusing", error);
        // something has gone terribly wrong with this instance,
        // attempt restart
        const { restartApp } = require("../app-helpers");
        restartApp();
    }
};
"use strict";

const fileOpenHelpers = require("../../file-open-helpers");

/**
 * @param {Electron.Event} event
 * @param {string[]} argv
 */
exports.secondInstance = (_, argv) => {
    // Someone tried to run a second instance, we should focus our window.
    const { mainWindow } = require("../window-management");
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();

        fileOpenHelpers.checkForFirebotSetupPath(argv);
    }
};
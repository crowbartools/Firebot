"use strict";

exports.secondInstance = () => {
    // Someone tried to run a second instance, we should focus our window.
    const { mainWindow } = require("../window-management");
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
};
"use strict";
const electron = require("electron");
const { app } = electron;

function startApp() {

    const logger = require("./backend/logwrapper");
    logger.info("Starting Firebot...");

    // ensure only a single instance of the app runs
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', () => {
            // Someone tried to run a second instance, we should focus our window.
            const { mainWindow } = require("./backend/app-management/electron/window-management");
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus();
            }
        });
    }

    // Handle an squrriel install/update events
    const { handleSquirrelEvents } = require("./backend/app-management/squirrel-events");
    if (!handleSquirrelEvents()) {
        // returns false if code execution should stop. App should be restarting at this point but
        // this ensures we dont try to continue
        return;
    }

    // Setup app listeners
    const appEvents = require("./backend/app-management/electron/electron-events");
    app.on("window-all-closed", appEvents.windowsAllClosed);
    app.on("will-quit", appEvents.willQuit);
    app.whenReady().then(appEvents.whenReady);
}

startApp();

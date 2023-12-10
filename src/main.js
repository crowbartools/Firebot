"use strict";
const { app } = require("electron");

const logger = require("./backend/logwrapper");
const secretsManager = require("./backend/secrets-manager");
const { handleSquirrelEvents } = require("./backend/app-management/squirrel-events");
const {
    whenReady,
    windowsAllClosed,
    willQuit,
    secondInstance,
    openUrl
} = require("./backend/app-management/electron/electron-events");

logger.info("Starting Firebot...");

if (!secretsManager.testSecrets()) {
    logger.debug("...Testing for secrets failed");
    app.quit();
    return;
}

logger.debug("...Secrets tested");

// Handle any squirrel install/update events
// returns false if the rest of app execution should stop.
if (!handleSquirrelEvents()) {
    return;
}

logger.debug("...Squirrel handled");

// Register firebot:// URI handler
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient("firebot", process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient("firebot");
}

// ensure only a single instance of the app runs
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    logger.debug("...Failed to get single instance lock");
    app.quit();
    return;
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    
        openUrl(event, commandLine.pop().slice(0, -1));
    });
}

logger.debug("...Single instance lock acquired");

// Setup app listeners
app.on('second-instance', secondInstance);
app.on("window-all-closed", windowsAllClosed);
app.on("will-quit", willQuit);
app.whenReady().then(whenReady).catch(error => {
    logger.debug("Error on when ready step", error);
});
app.on("open-url", openUrl);

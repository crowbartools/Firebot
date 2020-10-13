"use strict";
const { app } = require("electron");

const logger = require("./backend/logwrapper");
const secretsManager = require("./backend/secrets-manager");
const { handleSquirrelEvents } = require("./backend/app-management/squirrel-events");
const {
    whenReady,
    windowsAllClosed,
    willQuit,
    secondInstance
} = require("./backend/app-management/electron/electron-events");

logger.info("Starting Firebot...");

if (!secretsManager.testSecrets()) {
    app.quit();
    return;
}

// Handle any squirrel install/update events
// returns false if the rest of app execution should stop.
if (!handleSquirrelEvents()) {
    return;
}

// ensure only a single instance of the app runs
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    return;
}

// Setup app listeners
app.on('second-instance', secondInstance);
app.on("window-all-closed", windowsAllClosed);
app.on("will-quit", willQuit);
app.whenReady().then(whenReady);

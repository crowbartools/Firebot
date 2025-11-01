import { app, dialog } from "electron";
import os from "os";
import path from "path";

import logger from "./backend/logwrapper";
import { SecretsManager } from "./backend/secrets-manager";
import { handleSquirrelEvents } from "./backend/app-management/squirrel-events";
import {
    whenReady,
    windowsAllClosed,
    willQuit,
    secondInstance,
    openUrl,
    openFile
} from "./backend/app-management/electron/electron-events";

// TypeScript says no top-level returns.
// So we have a main function now.
async function main() {
    logger.info("Starting Firebot...");
    logger.info(`Firebot v${app.getVersion()}; Platform: ${os.platform()} ${os.arch()}; Version: ${os.type()} ${os.release()}`);

    if (!SecretsManager.testSecrets()) {
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

    logger.debug("...Registered Firebot URI handler");

    // ensure only a single instance of the app runs
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        logger.debug("...Failed to get single instance lock");
        app.quit();
        return;
    }

    logger.debug("...Single instance lock acquired");

    // Enable Text-To-Speech on Linux through speech-dispatcher
    if (process.platform === "linux") {
        app.commandLine.appendSwitch("enable-speech-dispatcher");
    }

    // attempt to get logged in profile
    const { ProfileManager } = await import("./backend/common/profile-manager");
    const loggedInProfile = ProfileManager.getLoggedInProfile(false);

    // We should have a value here. If we don't, something went wrong.
    if (loggedInProfile == null) {
        logger.error("Unexpected error while loading logged in profile. Exiting.");
        app.quit();
        return;
    }

    // Setup app listeners
    app.on("second-instance", secondInstance);
    app.on("open-file", openFile);
    app.on("window-all-closed", windowsAllClosed);
    app.on("will-quit", willQuit);
    app.whenReady().then(whenReady).catch((error) => {
        logger.error("Error on when ready step", error);
        dialog.showErrorBox("Error starting Firebot", "An unexpected error occurred while trying to start Firebot. Please try again. If the issue persists, please check the log file or post an issue in our Discord server.");
        app.quit();
    });
    app.on("open-url", openUrl);
}

void main();
import { app } from "electron";

import {
    whenReady,
    windowsAllClosed,
    secondInstance,
    activate,
    makeFirebotDataDir,
    ensureRootDataDirsExist,
} from "./app-management";
import { logger } from "./utils";

async function startFirebot() {
    // ensure only a single instance of the app runs
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
        return;
    }

    await makeFirebotDataDir();

    logger.info("Starting Firebot...");

    await ensureRootDataDirsExist();

    // Setup app listeners
    app.on("second-instance", secondInstance);
    app.on("window-all-closed", windowsAllClosed);
    app.on("activate", activate);
    app.whenReady().then(whenReady);
}

startFirebot();

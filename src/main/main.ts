import { app } from "electron";
import {
    whenReady,
    windowsAllClosed,
    secondInstance,
    activate,
} from "./app-management";

function startFirebot() {
    console.log("Starting Firebot...");

    // ensure only a single instance of the app runs
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
        return;
    }

    // Setup app listeners
    app.on("second-instance", secondInstance);
    app.on("window-all-closed", windowsAllClosed);
    app.on("activate", activate);
    app.whenReady().then(whenReady);
}

startFirebot();

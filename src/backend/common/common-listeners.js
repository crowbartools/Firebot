"use strict";
const electron = require("electron");
const { app, ipcMain, dialog, shell } = electron;

const path = require("path");

const logger = require("../logwrapper");

exports.setupCommonListeners = () => {

    const frontendCommunicator = require("./frontend-communicator");
    const dataAccess = require("./data-access");
    const profileManager = require("./profile-manager");
    const { settings } = require("./settings-access");
    const backupManager = require("../backup-manager");
    const webServer = require("../../server/http-server-manager");

    frontendCommunicator.on("show-twitch-preview", () => {
        const windowManagement = require("../app-management/electron/window-management");
        windowManagement.createStreamPreviewWindow();
    });

    frontendCommunicator.on("show-variable-inspector", () => {
        const windowManagement = require("../app-management/electron/window-management");
        windowManagement.createVariableInspectorWindow();
    });

    frontendCommunicator.onAsync("show-save-dialog", async data => {
        /**@type {Electron.SaveDialogOptions} */
        const options = data.options || {};

        /**@type {Electron.SaveDialogReturnValue} */
        let dialogResult = null;
        try {
            dialogResult = await dialog.showSaveDialog(options);
        } catch (error) {
            logger.error("Failed to show save dialog", error);
        }
        return dialogResult;
    });

    frontendCommunicator.onAsync("open-file-browser", async data => {
        const uuid = data.uuid,
            options = data.options || {};

        let dialogResult = null;
        try {
            dialogResult = await dialog.showOpenDialog({
                title: options.title ? options.title : undefined,
                buttonLabel: options.buttonLabel ? options.buttonLabel : undefined,
                properties: options.directoryOnly ? ["openDirectory"] : ["openFile"],
                filters: options.filters ? options.filters : undefined,
                defaultPath: data.currentPath ? data.currentPath : undefined
            });
        } catch (err) {
            logger.debug("Unable to get file path", err);
        }

        let path = null;
        if (dialogResult && !dialogResult.canceled && dialogResult.filePaths != null && dialogResult.filePaths.length > 0) {
            path = dialogResult.filePaths[0];
        }

        return { path: path, id: uuid };
    });

    frontendCommunicator.on("highlight-message", data => {
        const eventsManager = require("../events/EventManager");
        eventsManager.triggerEvent("firebot", "highlight-message", data);
    });

    frontendCommunicator.on("category-changed", category => {
        const eventsManager = require("../events/EventManager");
        eventsManager.triggerEvent("firebot", "category-changed", {category: category});
    });

    // Front old main

    // restarts the app
    ipcMain.on("restartApp", () => {
        const chatModerationManager = require("../chat/moderation/chat-moderation-manager");
        chatModerationManager.stopService();
        setTimeout(() => {
            app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
            app.exit(0);
        }, 100);
    });

    // Opens the firebot root folder
    ipcMain.on("openRootFolder", () => {
        const rootFolder = path.resolve(
            profileManager.getPathInProfile("/")
        );
        shell.openPath(rootFolder);
    });

    // Opens the firebot root folder
    ipcMain.on("openLogsFolder", () => {
        const rootFolder = path.resolve(
            dataAccess.getPathInUserData("/logs/")
        );
        shell.openPath(rootFolder);
    });

    // Get Import Folder Path
    // This listens for an event from the render media.js file to open a dialog to get a filepath.
    ipcMain.on("getImportFolderPath", (event, uniqueid) => {
        const path = dialog.showOpenDialogSync({
            title: "Select 'user-settings' folder",
            buttonLabel: "Import 'user-settings'",
            properties: ["openDirectory"]
        });
        event.sender.send("gotImportFolderPath", { path: path, id: uniqueid });
    });

    // Get Get Backup Zip Path
    // This listens for an event from the render media.js file to open a dialog to get a filepath.
    ipcMain.on("getBackupZipPath", (event, uniqueid) => {
        const backupsFolderPath = path.resolve(
            `${dataAccess.getUserDataPath() + path.sep}backups${path.sep}`
        );

        const fs = require("fs");
        let backupsFolderExists = false;
        try {
            backupsFolderExists = fs.existsSync(backupsFolderPath);
        } catch (err) {
            logger.warn("cannot check if backup folder exists", err);
        }

        const zipPath = dialog.showOpenDialogSync({
            title: "Select backup zp",
            buttonLabel: "Select Backup",
            defaultPath: backupsFolderExists ? backupsFolderPath : undefined,
            filters: [{ name: "Zip", extensions: ["zip"] }]
        });
        event.sender.send("gotBackupZipPath", { path: zipPath, id: uniqueid });
    });

    // Opens the firebot backup folder
    ipcMain.on("openBackupFolder", () => {
        // We include "fakefile.txt" as a workaround to make it open into the 'root' folder instead
        // of opening to the poarent folder with 'Firebot'folder selected.
        const backupFolder = path.resolve(`${dataAccess.getUserDataPath() + path.sep}backups${path.sep}`);
        shell.openPath(backupFolder);
    });

    ipcMain.on("startBackup", (event, manualActivation = false) => {
        backupManager.startBackup(manualActivation, () => {
            logger.info("backup complete");
            renderWindow.webContents.send("backupComplete", manualActivation);
        });
    });

    // When we get an event from the renderer to create a new profile.
    ipcMain.on("createProfile", (_, profileName) => {
        profileManager.createNewProfile(profileName);
    });

    // When we get an event from the renderer to delete a particular profile.
    ipcMain.on("deleteProfile", () => {
        profileManager.deleteProfile();
    });

    // Change profile when we get event from renderer
    ipcMain.on("switchProfile", function(_, profileId) {
        profileManager.logInProfile(profileId);
    });

    ipcMain.on("renameProfile", function(_, newProfileId) {
        profileManager.renameProfile(newProfileId);
    });

    // Get Any kind of file Path
    // This listens for an event from the front end.
    ipcMain.on("getAnyFilePath", (event, data) => {
        const uuid = data.uuid,
            options = data.options || {};

        const path = dialog.showOpenDialogSync({
            title: options.title ? options.title : undefined,
            buttonLabel: options.buttonLabel ? options.buttonLabel : undefined,
            properties: options.directoryOnly ? ["openDirectory"] : ["openFile"],
            filters: options.filters ? options.filters : undefined,
            defaultPath: data.currentPath ? data.currentPath : undefined
        });

        event.sender.send("gotAnyFilePath", { path: path, id: uuid });
    });

    // Change profile when we get event from renderer
    ipcMain.on("sendToOverlay", function(_, data) {
        if (data == null) {
            return;
        }
        webServer.sendToOverlay(data.event, data.meta);
    });

    const updaterOptions = {
        repo: "crowbartools/firebot",
        currentVersion: app.getVersion()
    };

    ipcMain.on("downloadUpdate", async () => {
        const GhReleases = require("electron-gh-releases");

        //back up first
        if (settings.backupBeforeUpdates()) {
            await backupManager.startBackup();
        }

        // Download Update
        const updater = new GhReleases(updaterOptions);

        updater.check(err => {
            // Download the update
            updater.download();

            if (err) {
                logger.info(err);
            }
        });

        // When an update has been downloaded
        updater.on("update-downloaded", () => {
            logger.info("Updated downloaded.");
            //let the front end know and wait a few secs.
            renderWindow.webContents.send("updateDownloaded");

            // Prepare for update install on next run
            settings.setJustUpdated(true);
        });
    });

    ipcMain.on("installUpdate", () => {
        logger.info("Installing update...");
        renderWindow.webContents.send("installingUpdate");

        const GhReleases = require("electron-gh-releases");

        // Download Update
        const updater = new GhReleases(updaterOptions);

        updater.install();

        // Access electrons autoUpdater
        // eslint-disable-next-line no-unused-expressions
        updater.autoUpdater;
    });
};

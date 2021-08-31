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
    const backupManager = require("../backupManager");
    const webServer = require("../../server/httpServer");

    frontendCommunicator.on("show-twitch-preview", () => {
        const windowManagement = require("../app-management/electron/window-management");
        // const view = new BrowserView();
        // windowManagement.mainWindow.setBrowserView(view);
        // view.setBounds({ x: 0, y: 0, width: 300, height: 300 });
        // view.webContents.loadURL('https://player.twitch.tv/?channel=evilnotion&muted=true&parent=twitch.tv');
        windowManagement.createStreamPreviewWindow();
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
        let uuid = data.uuid,
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
        setTimeout(() => {
            app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
            app.exit(0);
        }, 100);
    });

    // Opens the firebot root folder
    ipcMain.on("openRootFolder", () => {
    // We include "fakefile.txt" as a workaround to make it open into the 'root' folder instead
    // of opening to the poarent folder with 'Firebot'folder selected.
        let rootFolder = path.resolve(
            profileManager.getPathInProfile("/")
        );
        shell.openItem(rootFolder);
    });

    // Opens the firebot root folder
    ipcMain.on("openLogsFolder", () => {
    // We include "fakefile.txt" as a workaround to make it open into the 'root' folder instead
    // of opening to the poarent folder with 'Firebot'folder selected.
        let rootFolder = path.resolve(
            dataAccess.getPathInUserData("/logs/")
        );
        shell.openItem(rootFolder);
    });

    // Get Import Folder Path
    // This listens for an event from the render media.js file to open a dialog to get a filepath.
    ipcMain.on("getImportFolderPath", (event, uniqueid) => {
        let path = dialog.showOpenDialogSync({
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
            dataAccess.getUserDataPath() + path.sep + "backups" + path.sep
        );

        let fs = require("fs-extra");
        let backupsFolderExists = false;
        try {
            backupsFolderExists = fs.existsSync(backupsFolderPath);
        } catch (err) {
            logger.warn("cannot check if backup folder exists", err);
        }

        let zipPath = dialog.showOpenDialogSync({
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
        let backupFolder = path.resolve(dataAccess.getUserDataPath() + path.sep + "backups" + path.sep);
        shell.openItem(backupFolder);
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
        let uuid = data.uuid,
            options = data.options || {};

        let path = dialog.showOpenDialogSync({
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
        if (data == null) return;
        webServer.sendToOverlay(data.event, data.meta);
    });

    ipcMain.on("downloadUpdate", () => {

        const GhReleases = require("electron-gh-releases");

        //back up first
        if (settings.backupBeforeUpdates()) {
            backupManager.startBackup();
        }

        // Download Update
        let options = {
            repo: "crowbartools/firebot",
            currentVersion: app.getVersion()
        };

        let updater = new GhReleases(options);

        updater.check(err => {
            // Download the update
            updater.download();

            if (err) {
                logger.info(err);
            }
        });

        // When an update has been downloaded
        updater.on("update-downloaded", () => {
            logger.info("Updated downloaded. Installing...");
            //let the front end know and wait a few secs.
            renderWindow.webContents.send("updateDownloaded");

            setTimeout(function() {
                // Restart the app and install the update
                settings.setJustUpdated(true);

                updater.install();
            }, 3 * 1000);
        });

        // Access electrons autoUpdater
        // eslint-disable-next-line no-unused-expressions
        updater.autoUpdater;
    });
};


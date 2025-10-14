"use strict";

const { app, dialog, shell, autoUpdater } = require("electron");
const logger = require("../logwrapper");
const { restartApp } = require("../app-management/electron/app-helpers");

exports.setupCommonListeners = () => {
    const frontendCommunicator = require("./frontend-communicator");
    const profileManager = require("./profile-manager");
    const { SettingsManager } = require("./settings-manager");
    const { BackupManager } = require("../backup-manager");
    const webServer = require("../../server/http-server-manager");

    frontendCommunicator.on("show-twitch-preview", () => {
        const windowManagement = require("../app-management/electron/window-management");
        windowManagement.createStreamPreviewWindow();
    });

    frontendCommunicator.on("show-variable-inspector", () => {
        const windowManagement = require("../app-management/electron/window-management");
        windowManagement.createVariableInspectorWindow();
    });

    frontendCommunicator.onAsync("show-save-dialog", async (data) => {
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

    frontendCommunicator.onAsync("open-file-browser", async (data) => {
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

    frontendCommunicator.on("highlight-message", (data) => {
        const eventsManager = require("../events/EventManager");
        eventsManager.triggerEvent("firebot", "highlight-message", data);
    });

    frontendCommunicator.on("category-changed", (category) => {
        const eventsManager = require("../events/EventManager");
        eventsManager.triggerEvent("firebot", "category-changed", { category: category });
    });

    frontendCommunicator.on("restartApp", () => restartApp());

    frontendCommunicator.on("open-backup-folder", () => {
        shell.openPath(BackupManager.backupFolderPath);
    });

    // Front old main

    // When we get an event from the renderer to create a new profile.
    frontendCommunicator.on("createProfile", (profileName) => {
        profileManager.createNewProfile(profileName);
    });

    // When we get an event from the renderer to delete a particular profile.
    frontendCommunicator.on("deleteProfile", () => {
        profileManager.deleteProfile();
    });

    // Change profile when we get event from renderer
    frontendCommunicator.on("switchProfile", (profileId) => {
        profileManager.logInProfile(profileId);
    });

    frontendCommunicator.on("renameProfile", (newProfileId) => {
        profileManager.renameProfile(newProfileId);
    });

    // Change profile when we get event from renderer
    frontendCommunicator.on("sendToOverlay", (data) => {
        if (data == null) {
            return;
        }
        webServer.sendToOverlay(data.event, data.meta);
    });

    const updaterOptions = {
        repo: "crowbartools/firebot",
        currentVersion: app.getVersion()
    };

    const updateFeedUrl = `https://update.electronjs.org/crowbartools/Firebot/win32/${app.getVersion()}`;

    frontendCommunicator.on("downloadUpdate", async () => {
        //back up first
        if (SettingsManager.getSetting("BackupBeforeUpdates")) {
            await BackupManager.startBackup();
        }

        autoUpdater.setFeedURL({ url: updateFeedUrl });
        autoUpdater.checkForUpdates();

        // When an update has been downloaded
        autoUpdater.on("update-downloaded", () => {
            logger.info("Updated downloaded.");
            //let the front end know and wait a few secs.
            frontendCommunicator.send("updateDownloaded");

            // Prepare for update install on next run
            SettingsManager.saveSetting("JustUpdated", true);
        });
    });

    frontendCommunicator.on("installUpdate", () => {
        logger.info("Installing update...");
        frontendCommunicator.send("installingUpdate");

        autoUpdater.quitAndInstall();
    });
};
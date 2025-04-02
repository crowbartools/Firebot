"use strict";

const { app } = require("electron");

exports.windowsAllClosed = async () => {

    const logger = require("../../../logwrapper");
    logger.debug("All windows closed triggered");

    const { SettingsManager } = require("../../../common/settings-manager");
    const { BackupManager } = require("../../../backup-manager");

    // Stop all scheduled tasks
    const scheduledTaskManager = require("../../../timers/scheduled-task-manager");
    scheduledTaskManager.stop();

    // Stop all custom scripts so they can clean up
    const customScriptRunner = require("../../../common/handlers/custom-scripts/custom-script-runner");
    await customScriptRunner.stopAllScripts();

    // Unregister all shortcuts.
    const { HotkeyManager } = require("../../../hotkeys/hotkey-manager");
    HotkeyManager.unregisterAllHotkeys();

    // Persist custom variables
    if (SettingsManager.getSetting("PersistCustomVariables")) {
        const customVariableManager = require("../../../common/custom-variable-manager");
        customVariableManager.persistVariablesToFile();
    }

    // Set all users to offline
    const viewerOnlineStatusManager = require("../../../viewers/viewer-online-status-manager");
    await viewerOnlineStatusManager.setAllViewersOffline();

    if (SettingsManager.getSetting("BackupOnExit")) {
        // Make a backup
        await BackupManager.startBackup(false);
    }

    app.quit();
};
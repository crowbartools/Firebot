import logger from "../../../logwrapper";

export async function windowsAllClosed() {
    const { app } = await import("electron");
    const { BackupManager } = await import("../../../backup-manager");
    const { CustomVariableManager } = await import("../../../common/custom-variable-manager");
    const { HotkeyManager } = await import("../../../hotkeys/hotkey-manager");
    const { ScheduledTaskManager } = await import("../../../timers/scheduled-task-manager");
    const { SettingsManager } = await import("../../../common/settings-manager");
    const customScriptRunner = await import("../../../common/handlers/custom-scripts/custom-script-runner");
    const viewerOnlineStatusManager = (await import("../../../viewers/viewer-online-status-manager")).default;

    logger.debug("All windows closed triggered");

    // Stop all scheduled tasks
    ScheduledTaskManager.stop();

    // Stop all custom scripts so they can clean up
    await customScriptRunner.stopAllScripts();

    // Unregister all shortcuts.
    HotkeyManager.unregisterAllHotkeys();

    // Persist custom variables
    if (SettingsManager.getSetting("PersistCustomVariables")) {
        CustomVariableManager.persistVariablesToFile();
    }

    // Set all users to offline
    await viewerOnlineStatusManager.setAllViewersOffline();

    if (SettingsManager.getSetting("BackupOnExit")) {
        // Make a backup
        await BackupManager.startBackup(false);
    }

    app.quit();
};
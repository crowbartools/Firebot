import { app } from "electron";
import { BackupManager } from "../../../backup-manager";
import { HotkeyManager } from "../../../hotkeys/hotkey-manager";
import { ScheduledTaskManager } from "../../../timers/scheduled-task-manager";
import { SettingsManager } from "../../../common/settings-manager";
import customScriptRunner from "../../../common/handlers/custom-scripts/custom-script-runner";
import customVariableManager from "../../../common/custom-variable-manager";
import viewerOnlineStatusManager from "../../../viewers/viewer-online-status-manager";
import logger from "../../../logwrapper";

export async function windowsAllClosed() {
    logger.debug("All windows closed triggered");

    // Stop all scheduled tasks
    ScheduledTaskManager.stop();

    // Stop all custom scripts so they can clean up
    await customScriptRunner.stopAllScripts();

    // Unregister all shortcuts.
    HotkeyManager.unregisterAllHotkeys();

    // Persist custom variables
    if (SettingsManager.getSetting("PersistCustomVariables")) {
        customVariableManager.persistVariablesToFile();
    }

    // Set all users to offline
    await viewerOnlineStatusManager.setAllViewersOffline();

    if (SettingsManager.getSetting("BackupOnExit")) {
        // Make a backup
        await BackupManager.startBackup(false);
    }

    app.quit();
};
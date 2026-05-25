import { app, type Event } from "electron";
import logger from "../../../logwrapper";

async function cleanup() {
    const { handleProfileDeletion, handleProfileRename } = await import("../../../app-management/profile-tasks");
    handleProfileRename();
    handleProfileDeletion();
}

export async function willQuit(event: Event) {
    logger.debug("Will quit event triggered");

    event.preventDefault();

    const { EventManager } = await import("../../../events/event-manager");
    await EventManager.triggerEvent("firebot", "before-firebot-closed", {
        username: "Firebot"
    });

    const { BackupManager } = await import("../../../backup-manager");
    const { CustomVariableManager } = await import("../../../common/custom-variable-manager");
    const { HotkeyManager } = await import("../../../hotkeys/hotkey-manager");
    const { ScheduledTaskManager } = await import("../../../timers/scheduled-task-manager");
    const { SettingsManager } = await import("../../../common/settings-manager");
    const customScriptRunner = await import("../../../common/handlers/custom-scripts/custom-script-runner");
    const viewerOnlineStatusManager = (await import("../../../viewers/viewer-online-status-manager")).default;

    // Stop all scheduled tasks
    ScheduledTaskManager.stop();

    // Stop all custom scripts so they can clean up
    await customScriptRunner.stopAllScripts();

    // Unregister all shortcuts.
    HotkeyManager.unregisterAllHotkeys();

    // Persist custom variables
    CustomVariableManager.persistVariablesToFile();

    // Set all users to offline
    await viewerOnlineStatusManager.setAllViewersOffline();

    if (SettingsManager.getSetting("BackupOnExit")) {
        // Make a backup
        await BackupManager.startBackup(false);
    }

    const { AppCloseListenerManager } = await import("../../app-close-listener-manager");

    logger.debug("Running app close listeners...");

    try {
        await AppCloseListenerManager.runListeners();
    } catch {}

    logger.debug("App close listeners complete.");

    logger.debug("Doing clean up...");

    try {
        await cleanup();
    } catch (e) {
        logger.error("Error during cleanup before app exit", e);
    }

    logger.debug("...clean up complete. Exiting app");

    app.exit();
}
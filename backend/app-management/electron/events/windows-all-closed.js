"use strict";

const { app } = require("electron");

exports.windowsAllClosed = () => {

    const { settings } = require("../../../common/settings-access");
    const { startBackup } = require("../../../backupManager");

    // Unregister all shortcuts.
    let hotkeyManager = require("../../../hotkeys/hotkey-manager");
    hotkeyManager.unregisterAllHotkeys();

    const chatModerationManager = require("../../../chat/moderation/chat-moderation-manager");
    chatModerationManager.stopService();

    const userDatabase = require("../../../database/userDatabase");
    userDatabase.setAllUsersOffline().then(() => {
        if (settings.backupOnExit()) {
            startBackup(false, app.quit);
        } else {
            app.quit();
        }
    });
};
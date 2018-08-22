"use strict";

const { ipcMain, globalShortcut } = require("electron");
const profileManager = require("../../lib/common/profile-manager.js");
const { TriggerType } = require("../common/EffectType");
const effectRunner = require("../common/effect-runner.js");

const commandManager = require("../chat/commands/CommandManager");
const logger = require("../logwrapper");

let hotkeysCache = [];

function runHotkey(code) {
    let hotkey = hotkeysCache.find(k => k.code === code);

    let effects = [];
    switch (hotkey.action.type) {
    case "Run Effects": {
        effects = hotkey.action.metadata.effects;
        break;
    }
    case "Run Command": {

        let selectedCommandId = hotkey.action.metadata.commandId;

        let command = commandManager.getCustomCommandById(selectedCommandId);

        if (command != null) {
            effects = command.effects;
        }

        break;
    }
    case "Run Button": {

        //TODO: implement this

        break;
    }
    default:
        logger.error("This hotkey action type is not yet supported!");
        return;
    }

    if (effects == null) return;

    let processEffectsRequest = {
        trigger: {
            type: TriggerType.HOTKEY,
            metadata: {
                username: "Streamer",
                hotkey: hotkey
            }
        },
        effects: effects
    };
    effectRunner.processEffects(processEffectsRequest);
}

// Unregister Shortcuts
// When closing, this is called to unregister the global shortcuts that were created.
function unregisterAllHotkeys() {
    globalShortcut.unregisterAll();
}

function registerHotkey(accelerator) {
    globalShortcut.register(accelerator, () => {
        runHotkey(accelerator);
    });
}

function registerAllHotkeys() {
    if (hotkeysCache == null) return;
    hotkeysCache.filter(hk => hk.active).forEach(k => {
        registerHotkey(k.code);
    });
}

function refreshHotkeyCache(retry = 1) {
    // Setup events db.
    let dbEvents = profileManager.getJsonDbInProfile("/hotkeys");

    try {
        if (retry <= 3) {
            try {
                // Update Cache
                let hkraw = dbEvents.getData("/");
                if (hkraw != null && Array.isArray(hkraw)) {
                    hotkeysCache = hkraw;
                }
                logger.info("Updated Hotkeys cache.");
                unregisterAllHotkeys();
                registerAllHotkeys();
            } catch (err) {
                logger.error(
                    `Hotkeys cache update failed. Retrying. (Try ${retry++}/3)`
                );
                refreshHotkeyCache(retry);
            }
        } else {
            renderWindow.webContents.send(
                "error",
                "Could not sync up Hotkeys cache."
            );
        }
    } catch (err) {
        logger.error(err.message);
    }
}

function getHotkeyCache() {
    return hotkeysCache;
}

// Refresh Event Cache
// This refreshes the event cache for the backend with frontend changes are saved.
ipcMain.on("refreshHotkeyCache", function() {
    refreshHotkeyCache();
});

// Export Functions
exports.getEventCache = getHotkeyCache;
exports.refreshHotkeyCache = refreshHotkeyCache;
exports.unregisterAllHotkeys = unregisterAllHotkeys;

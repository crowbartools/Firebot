"use strict";

const { ipcMain, globalShortcut } = require("electron");
const profileManager = require("../../backend/common/profile-manager.js");
const { TriggerType } = require("../common/EffectType");
const effectRunner = require("../common/effect-runner.js");

const accountAccess = require("../common/account-access");
const logger = require("../logwrapper");

let hotkeysCache = [];

function runHotkey(code) {
    let hotkey = hotkeysCache.find(k => k.code === code);

    let effects = hotkey.effects;

    if (effects == null) {
        return;
    }

    let processEffectsRequest = {
        trigger: {
            type: TriggerType.HOTKEY,
            metadata: {
                username: accountAccess.getAccounts().streamer.username,
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
    try {
        const success = globalShortcut.register(accelerator, () => {
            runHotkey(accelerator);
        });
        if (!success) {
            logger.warn(`Unable to register hotkey ${accelerator} with OS. This typically means it's already taken by another application.`);
        }
    } catch (error) {
        logger.error(`Error while registering hotkey ${accelerator} with OS`, error);
    }
}

function registerAllHotkeys() {
    if (hotkeysCache == null) {
        return;
    }
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
                    `Hotkeys cache update failed. Retrying. (Try ${retry++}/3)`, err
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
exports.getHotkeyCache = getHotkeyCache;
exports.refreshHotkeyCache = refreshHotkeyCache;
exports.unregisterAllHotkeys = unregisterAllHotkeys;

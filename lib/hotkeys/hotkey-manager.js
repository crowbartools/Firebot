'use strict';

const {ipcMain, globalShortcut} = require('electron');
const dataAccess = require('../../lib/common/data-access.js');
const { TriggerType } = require('../common/EffectType');
const effectRunner = require('../common/effect-runner.js');
const EffectBuilder = require('../common/handlers/custom-scripts/effectsObjectBuilder');

let hotkeysCache = [];



function runHotkey(code) {
    let hotkey = hotkeysCache.find(k => k.code === code);
    switch (hotkey.action.type) {
    case "Run Effects": {
        let effects = hotkey.action.metadata.effects;

        // Create request wrapper (instead of having to pass in a ton of args)
        let processEffectsRequest = {
            trigger: {
                type: TriggerType.HOTKEY,
                metadata: {
                    username: "Streamer",
                    hotkey: hotkey
                }
            },
            effects: EffectBuilder.buildEffects(effects)
        };

        effectRunner.processEffects(processEffectsRequest);
        break;
    }
    default:
        console.log("This hotkey action type is not yet supported!");
        return;
    }
}

// Unregister Shortcuts
// When closing, this is called to unregister the global shortcuts that were created.
function unregisterAllHotkeys() {
    globalShortcut.unregisterAll();
    console.log("unregistered all hotkeys");
}

function registerHotkey(accelerator) {
    console.log("registering " + accelerator);
    globalShortcut.register(accelerator, () => {
        runHotkey(accelerator);
    });
}

function registerAllHotkeys() {
    if (hotkeysCache == null) return;

    hotkeysCache
        .filter(hk => hk.active)
        .forEach(k => {
            registerHotkey(k.code);
        });
}

function refreshHotkeyCache (retry = 1) {

    // Setup events db.
    let dbEvents = dataAccess.getJsonDbInUserData("/user-settings/hotkeys");

    try {
        if (retry <= 3) {
            try {
                // Update Cache
                hotkeysCache = dbEvents.getData('/');
                console.log('Updated Hotkeys cache.');
                unregisterAllHotkeys();
                registerAllHotkeys();
            } catch (err) {
                console.log(`Hotkeys cache update failed. Retrying. (Try ${retry++}/3)`);
                console.error(err);
                refreshHotkeyCache(retry);
            }
        } else {
            renderWindow.webContents.send('error', "Could not sync up Hotkeys cache.");
        }
    } catch (err) {
        console.log(err.message);
    }
}

function getHotkeyCache () {
    return hotkeysCache;
}

// Refresh Event Cache
// This refreshes the event cache for the backend with frontend changes are saved.
ipcMain.on('refreshHotkeyCache', function() {
    refreshHotkeyCache();
});

// Export Functions
exports.getEventCache = getHotkeyCache;
exports.refreshHotkeyCache = refreshHotkeyCache;
exports.unregisterAllHotkeys = unregisterAllHotkeys;
'use strict';

const {ipcMain, globalShortcut} = require('electron');
const dataAccess = require('../../lib/common/data-access.js');
const { TriggerType } = require('../common/EffectType');
const effectRunner = require('../common/effect-runner.js');
const EffectBuilder = require('../common/handlers/custom-scripts/effectsObjectBuilder');

const Chat = require('../common/mixer-chat');
const Interactive = require('../common/mixer-interactive');
const logger = require('../logwrapper');

let hotkeysCache = [];

function runHotkey(code) {
    let hotkey = hotkeysCache.find(k => k.code === code);

    let effectsObj = null;
    switch (hotkey.action.type) {
    case "Run Effects": {
        let effects = hotkey.action.metadata.effects;

        effectsObj = EffectBuilder.buildEffects(effects);

        break;
    }
    case "Run Command": {
        let selectedCommand = hotkey.action.metadata.command;
        let commands = [];
        Object.values(Chat.getCommandCache()).forEach(t => {
            commands = commands.concat(Object.values(t));
        });

        let command = commands.find(c => c.commandID === selectedCommand.id);

        if (command != null) {
            effectsObj = command.effects;
        }

        break;
    }
    case "Run Button": {
        let selectedButton = hotkey.action.metadata.button;

        let boardId = selectedButton.board.id;

        let interactiveCache = Interactive.getInteractiveCache();

        if (boardId !== interactiveCache.versionid) {
            renderWindow.webContents.send('error', "Attempted to use a hotkey for button in a board that is not currently active.");
            return;
        }

        let buttons = Object.values(interactiveCache.firebot.controls);

        let button = buttons.find(b => b.controlId === selectedButton.id);

        if (button != null) {
            effectsObj = button.effects;
        }

        break;
    }
    default:
        logger.error("This hotkey action type is not yet supported!");
        return;
    }

    if (effectsObj == null) return;

    let processEffectsRequest = {
        trigger: {
            type: TriggerType.HOTKEY,
            metadata: {
                username: "Streamer",
                hotkey: hotkey
            }
        },
        effects: effectsObj
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
                let hkraw = dbEvents.getData('/');
                if (hkraw != null && Array.isArray(hkraw)) {
                    hotkeysCache = hkraw;
                }
                logger.info('Updated Hotkeys cache.');
                unregisterAllHotkeys();
                registerAllHotkeys();
            } catch (err) {
                logger.error(`Hotkeys cache update failed. Retrying. (Try ${retry++}/3)`);
                refreshHotkeyCache(retry);
            }
        } else {
            renderWindow.webContents.send('error', "Could not sync up Hotkeys cache.");
        }
    } catch (err) {
        logger.error(err.message);
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
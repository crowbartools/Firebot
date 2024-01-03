"use strict";

const path = require("path");
const logger = require("../../../logwrapper");
const uuid = require("uuid/v1");
const importHelpers = require("../import-helpers");
const profileManager = require("../../../common/profile-manager");
const frontendCommunicator = require("../../../common/frontend-communicator");

const effectsMapper = require("../v4-effect-mapper");

function saveHotkeysToFile(hotkeys) {
    const hotkeyDb = profileManager.getJsonDbInProfile("/hotkeys");
    try {
        const hotkeyData = hotkeyDb.getData("/");
        let currentHotkeys = [];
        if (hotkeyData != null && hotkeyData.length > 0) {
            currentHotkeys = hotkeyData;
        }

        currentHotkeys = currentHotkeys.concat(hotkeys);

        hotkeyDb.push("/", currentHotkeys);
    } catch (err) {
        logger.error(err);
    }
}

async function checkForV4Hotkeys() {
    const v4HotkeysPath = path.join(importHelpers.v4DataPath, "/hotkeys.json");
    const v4HotkeysDetected = await importHelpers.pathExists(v4HotkeysPath);
    return v4HotkeysDetected;
}

exports.run = async () => {
    const incompatibilityWarnings = [];

    const v4HotkeysExist = await checkForV4Hotkeys();

    if (v4HotkeysExist) {
        let v4Hotkeys;
        try {
            const v4HotkeysDb = importHelpers.getJsonDbInV4Data("/hotkeys.json");
            v4Hotkeys = v4HotkeysDb.getData("/");
        } catch (err) {
            logger.warn("Error while attempting to load v4 hotkeys db.", err);
        }

        if (v4Hotkeys != null) {

            const v5Hotkeys = [];
            for (const v4Hotkey of v4Hotkeys) {

                if (v4Hotkey.action == null || v4Hotkey.action.type !== "Run Effects") {
                    incompatibilityWarnings.push(`Could not import hotkey '${v4Hotkey.name}' because: V5 hotkeys have fundamentally changed and don't support v4 action type '${v4Hotkey.action.type}'`);
                    continue;
                }

                const v5Hotkey = {
                    id: uuid(),
                    active: v4Hotkey.active !== false,
                    code: v4Hotkey.code,
                    name: v4Hotkey.name
                };

                const effects = v4Hotkey.action.metadata != null ? v4Hotkey.action.metadata.effects : [];

                if (effects != null) {
                    const effectsMapResult = effectsMapper.mapV4EffectList(effects, { type: "Event", name: v4Hotkey.name });
                    if (effectsMapResult) {
                        v5Hotkey.effects = effectsMapResult.effects;
                        effectsMapResult.incompatibilityWarnings.forEach(w => incompatibilityWarnings.push(w));
                    }
                }

                v5Hotkeys.push(v5Hotkey);
            }

            saveHotkeysToFile(v5Hotkeys);

            frontendCommunicator.send("import-hotkeys-update");
        }
    }

    return {
        success: true,
        incompatibilityWarnings: incompatibilityWarnings
    };
};

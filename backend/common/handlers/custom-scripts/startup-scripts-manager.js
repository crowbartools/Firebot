"use strict";

const logger = require("../../../logwrapper");
const profileManager = require("../../../common/profile-manager");
const frontendCommunicator = require("../../../common/frontend-communicator");
const { EffectTrigger } = require("../../../../shared/effect-constants");
const effectRunner = require("../../../common/effect-runner");

let startupScripts = {};

function getStartupScriptsConfig() {
    return profileManager
        .getJsonDbInProfile("startup-scripts-config");
}

function loadStartupConfig() {
    logger.debug(`Attempting to load start up script config data...`);

    const startupScriptsConfig = getStartupScriptsConfig();

    try {
        const startupScriptsData = startupScriptsConfig.getData("/");

        if (startupScriptsData) {
            startupScripts = startupScriptsData;
        }

        logger.debug(`Loaded start up scripts.`);
    } catch (err) {
        logger.warn(`Loaded start up scripts.`, err);
    }
}

function saveStartupScriptData(startupScriptData) {
    if (startupScriptData == null) {
        return;
    }

    startupScripts[startupScriptData.id] = startupScriptData;

    try {
        const startupScriptsConfig = getStartupScriptsConfig();

        startupScriptsConfig.push("/" + startupScriptData.id, startupScriptData);

        logger.debug(`Saved preset effect list ${startupScriptData.id} to file.`);
    } catch (err) {
        logger.warn(`There was an error saving a preset effect list.`, err);
    }
}

function deleteStartupScriptData(startupScriptDataId) {
    if (startupScriptDataId == null) {
        return;
    }

    delete startupScripts[startupScriptDataId];

    try {
        const startupScriptsConfig = getStartupScriptsConfig();

        startupScriptsConfig.delete("/" + startupScriptDataId);

        logger.debug(`Deleted startup script data: ${startupScriptDataId}`);

    } catch (err) {
        logger.warn(`There was an error deleting startup script data.`, err);
    }
}

function getStartupScriptData(startupScriptDataId) {
    if (startupScriptDataId == null) {
        return null;
    }
    return startupScripts[startupScriptDataId];
}

/**
 * Turns startup script data into valid Custom Script effects and runs them
 */
async function runStartupScripts() {
    const scriptEffects = Object.values(JSON.parse(JSON.stringify(startupScripts))).map(s => {
        s.type = "firebot:customscript";
        return s;
    });

    const processEffectsRequest = {
        trigger: {
            type: EffectTrigger.STARTUP_SCRIPT,
            metadata: {
                username: "Firebot"
            }
        },
        effects: {
            list: scriptEffects
        }
    };

    try {
        await effectRunner.processEffects(processEffectsRequest);
    } catch (error) {
        logger.error("Error running startup scripts", error);
    }
}

frontendCommunicator.onAsync("getStartupScripts", async () => startupScripts);

frontendCommunicator.on("saveStartupScriptData", (startupScriptData) => {
    saveStartupScriptData(startupScriptData);
});

frontendCommunicator.on("deleteStartupScriptData", (startupScriptDataId) => {
    deleteStartupScriptData(startupScriptDataId);
});

exports.runStartupScripts = runStartupScripts;
exports.loadStartupConfig = loadStartupConfig;
exports.getStartupScriptData = getStartupScriptData;
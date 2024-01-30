"use strict";

const logger = require("../../../logwrapper");
const profileManager = require("../../../common/profile-manager");
const frontendCommunicator = require("../../../common/frontend-communicator");
const { runStartUpScript, startUpScriptSaved, startUpScriptDeleted } = require("./custom-script-runner");

/**
 * @typedef ScriptData
 * @property {string} id
 * @property {string} name
 * @property {string} scriptName
 * @property {Record<string,{ value: unknown; default: unknown; }>} parameters
 */

/**
 * @type {Record<string,ScriptData>}
 */
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

/**
 * @param {ScriptData} startupScriptData
 */
function saveStartupScriptData(startupScriptData) {
    if (startupScriptData == null) {
        return;
    }

    startupScripts[startupScriptData.id] = startupScriptData;

    try {
        const startupScriptsConfig = getStartupScriptsConfig();

        startupScriptsConfig.push(`/${startupScriptData.id}`, startupScriptData);

        logger.debug(`Saved startup script data ${startupScriptData.id} to file.`);
    } catch (err) {
        logger.warn(`There was an error saving startup script data.`, err);
    }

    startUpScriptSaved(startupScriptData);
}

/**
 * @param {ScriptData} startupScriptData
 */
function deleteStartupScriptData(startupScriptDataId) {
    if (startupScriptDataId == null) {
        return;
    }

    const startUpScriptData = startupScripts[startupScriptDataId];
    if (startUpScriptData != null) {
        startUpScriptDeleted(startUpScriptData);
    }

    delete startupScripts[startupScriptDataId];

    try {
        const startupScriptsConfig = getStartupScriptsConfig();

        startupScriptsConfig.delete(`/${startupScriptDataId}`);

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
    for (const startupScriptConfig of Object.values(startupScripts)) {
        await runStartUpScript(startupScriptConfig);
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
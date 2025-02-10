"use strict";
const { ipcMain, shell } = require("electron");
const { v4: uuid } = require("uuid");
const logger = require("../../../logwrapper");
const utils = require("../../../utility");
const profileManager = require("../../profile-manager");
const { getScriptPath, buildRunRequest, mapParameters } = require("./custom-script-helpers");
const effectRunner = require("../../effect-runner.js");
import frontendCommunicator from "../../frontend-communicator";
import { SettingsManager } from "../../settings-manager";

/**
 * @typedef { import('./script-types').ScriptData } ScriptData
 * @typedef { import('./script-types').CustomScript } CustomScript
 * @typedef { import('./script-types').Trigger } Trigger
 */

/**
 * @type {Record<string, CustomScript>}
 */
const activeCustomScripts = {};

/**
 *
 * @param {ScriptData} scriptData
 * @param {Trigger} trigger
 */
async function executeScript(scriptData, trigger, isStartupScript = false) {
    const { scriptName, parameters, id} = scriptData;

    const scriptFilePath = getScriptPath(scriptName);

    // Attempt to load the script
    /**
     * @type {CustomScript}
     */
    let customScript;
    try {
        // Make sure we first remove the cached version, incase there was any changes
        if (SettingsManager.getSetting("ClearCustomScriptCache")) {
            delete require.cache[require.resolve(scriptFilePath)];
        }
        customScript = require(scriptFilePath);
    } catch (error) {
        frontendCommunicator.send("error", `Error loading the script '${scriptName}' \n\n ${error}`);
        logger.error(error);
        return;
    }

    // Verify the script contains the "run" function
    if (typeof customScript.run !== "function") {
        frontendCommunicator.send(
            "error",
            `Error running '${scriptName}', script does not contain an exported 'run' function.`
        );
        return;
    }

    const manifest = {
        name: "Unknown Script",
        version: "Unknown Version",
        startupOnly: false
    };

    // set manifest values if they exist
    if (customScript.getScriptManifest) {
        const scriptManifest = customScript.getScriptManifest();
        if (scriptManifest) {
            manifest.name = scriptManifest.name || manifest.name;
            manifest.version = scriptManifest.version || manifest.version;
            manifest.startupOnly = scriptManifest.startupOnly;
        }
    }

    if (manifest.startupOnly && !isStartupScript) {
        frontendCommunicator.send(
            "error",
            `Could not run startup-only script "${manifest.name}" as it was executed outside of Firebot startup (Settings > Advanced > Startup Scripts)`
        );
        return;
    }

    const runRequest = buildRunRequest(manifest, mapParameters(parameters), trigger || {});

    // wait for script to finish for a maximum of 10 secs
    let response;
    try {
        response = await Promise.race([Promise.resolve(customScript.run(runRequest)), utils.wait(10 * 1000)]);
    } catch (error) {
        logger.error(`Error while running script '${scriptName}'`, error);
        return;
    }

    if (isStartupScript) {
        activeCustomScripts[id] = customScript;
    }

    if (response == null || typeof response !== "object") {
        return;
    }

    if (!response.success) {
        logger.error("Script failed with message:", response.errorMessage);
        frontendCommunicator.send("error", `Custom script failed with the message: ${response.errorMessage}`);
        return;
    }

    if (typeof response.callback !== "function") {
        response.callback = () => {};
    }

    const effects = response.effects;
    if (effects == null) {
        return;
    }

    const effectsIsArray = Array.isArray(effects);

    let effectsObj;
    if (!effectsIsArray && effects.list != null) {
        effectsObj = effects;
    } else if (effectsIsArray) {
        effectsObj = {
            id: uuid(),
            list: effects
                .filter(e => e.type != null && e.type !== "")
                .map((e) => {
                    if (e.id == null) {
                        e.id = uuid();
                    }
                    return e;
                })
        };

        const clonedTrigger = JSON.parse(JSON.stringify(trigger || {}));

        const processEffectsRequest = {
            trigger: clonedTrigger,
            effects: effectsObj
        };

        try {
            const runResult = await effectRunner.processEffects(processEffectsRequest);

            response.callback("effects");

            if (runResult != null && runResult.success === true) {
                if (runResult.stopEffectExecution) {
                    return {
                        success: true,
                        execution: {
                            stop: true,
                            bubbleStop: true
                        }
                    };
                }
            }
        } catch (error) {
            logger.error("Error running effects for script", error);
        }
    }
}

/**
 * @param {ScriptData} startUpScriptConfig
 */
async function runStartUpScript(startUpScriptConfig) {
    const { scriptName } = startUpScriptConfig;
    logger.debug(`running startup script: ${scriptName}`);

    if (SettingsManager.getSetting("RunCustomScripts") !== true) {
        logger.warn("Attempted to run startup script but custom scripts are disabled.");
        return;
    }

    try {
        await executeScript(startUpScriptConfig, null, true);
    } catch (error) {
        logger.error(`Failed to run startup script '${scriptName}'`, error);
    }
}

/**
 * @param {ScriptData} startUpScriptConfig
 */
async function startUpScriptSaved(startUpScriptConfig) {
    const activeScript = activeCustomScripts[startUpScriptConfig.id];
    if (activeScript == null) {
        runStartUpScript(startUpScriptConfig);
        return;
    }
    if (activeScript.parametersUpdated) {
        activeScript.parametersUpdated(mapParameters(startUpScriptConfig.parameters));
    }
}

/**
 * @param {ScriptData} startUpScriptConfig
 */
async function startUpScriptDeleted(startUpScriptConfig) {
    const activeScript = activeCustomScripts[startUpScriptConfig.id];
    if (activeScript == null) {
        return;
    }
    if (activeScript.stop != null) {
        try {
            await Promise.resolve(activeScript.stop());
        } catch (error) {
            logger.error(`Error when attempting to stop custom script`, error);
        }
    }
    const scriptFilePath = getScriptPath(startUpScriptConfig.scriptName);
    try {
        delete require.cache[require.resolve(scriptFilePath)];
    } catch (error) {
        logger.error(`Error when attempting to remove script from memory`, error);
    }

    delete activeCustomScripts[startUpScriptConfig.id];
}

/**
 *
 * @param {ScriptData} effect
 * @param {Trigger} trigger
 */
function runScript(effect, trigger) {
    const { scriptName } = effect;

    logger.debug(`running script: ${scriptName}`);

    if (!SettingsManager.getSetting("RunCustomScripts")) {
        frontendCommunicator.send(
            "error",
            "Something attempted to run a custom script but this feature is disabled!"
        );
        return;
    }

    return executeScript(effect, trigger);
}

async function stopAllScripts() {
    logger.info("Stopping all custom scripts...");
    for (const activeScript of Object.values(activeCustomScripts)) {
        if (activeScript.stop != null) {
            try {
                await Promise.resolve(activeScript.stop());
            } catch (error) {
                logger.error(`Error when attempting to stop custom script`, error);
            }
        }
    }
    logger.info("Stopped all custom scripts");
}

ipcMain.on("openScriptsFolder", function () {
    shell.openPath(profileManager.getPathInProfile("/scripts"));
});

exports.runScript = runScript;
exports.runStartUpScript = runStartUpScript;
exports.startUpScriptSaved = startUpScriptSaved;
exports.startUpScriptDeleted = startUpScriptDeleted;
exports.stopAllScripts = stopAllScripts;

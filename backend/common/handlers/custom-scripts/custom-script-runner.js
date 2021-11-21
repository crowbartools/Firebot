"use strict";
const {
    ipcMain,
    shell
} = require('electron');
const uuid = require("uuid/v4");
const logger = require('../../../logwrapper');
const { settings } = require('../../settings-access');
const utils = require("../../../utility");
const profileManager = require("../../profile-manager");
const {
    getScriptPath,
    buildRunRequest,
    mapParameters,
    mapV4EffectToV5
} = require("./custom-script-helpers");
const effectRunner = require('../../effect-runner.js');

async function runScript(effect, trigger) {
    const { scriptName, parameters } = effect;

    logger.debug("running script: " + scriptName);

    if (!settings.isCustomScriptsEnabled()) {
        renderWindow.webContents.send("error",
            "Something attempted to run a custom script but this feature is disabled!");
        return;
    }

    const scriptFilePath = getScriptPath(scriptName);

    // Attempt to load the script
    let customScript;
    try {
        // Make sure we first remove the cached version, incase there was any changes
        if (settings.getClearCustomScriptCache()) {
            delete require.cache[require.resolve(scriptFilePath)];
        }
        customScript = require(scriptFilePath);
    } catch (error) {
        renderWindow.webContents.send("error", `Error loading the script '${scriptName}' \n\n ${error}`);
        logger.error(error);
        return;
    }

    // Verify the script contains the "run" function
    if (typeof customScript.run !== "function") {
        renderWindow.webContents.send("error", `Error running '${scriptName}', script does not contain an exported 'run' function.`);
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

    if (manifest.startupOnly && !(trigger.type === "startup_script" || ((trigger.type === "event" || trigger.type === "manual") &&
        trigger.metadata.event.id === "firebot-started"))) {
        renderWindow.webContents.send("error", `Could not run startup-only script "${manifest.name}" as it was executed outside of Firebot startup (Settings > Advanced > Startup Scripts)`);
        return;
    }

    const runRequest = buildRunRequest(manifest, mapParameters(parameters), trigger);

    // wait for script to finish for a maximum of 10 secs
    let response;
    try {
        response = await Promise.race([
            Promise.resolve(customScript.run(runRequest)),
            utils.wait(10 * 1000)
        ]);
    } catch (error) {
        logger.error(`Error while running script '${scriptName}'`, error);
        return;
    }

    if (response == null || typeof response !== "object") {
        return;
    }

    if (!response.success) {
        logger.error("Script failed with message:", response.errorMessage);
        renderWindow.webContents.send("error", "Custom script failed with the message: " + response.errorMessage);
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
                .map(e => {
                    e = mapV4EffectToV5(e);
                    if (e.id == null) {
                        e.id = uuid();
                    }
                    return e;
                })

        };

        const clonedTrigger = Object.assign({}, trigger);

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

ipcMain.on("openScriptsFolder", function() {
    shell.openPath(profileManager.getPathInProfile("/scripts"));
});

exports.runScript = runScript;
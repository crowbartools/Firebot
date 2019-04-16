'use strict';
const {ipcMain} = require('electron');
const logger = require('../logwrapper');

const Interactive = require("./mixer-interactive.js");
const Chat = require("./mixer-chat.js");

const effectManager = require("../effects/effectManager");
const { EffectDependency, EffectTrigger } = require("../effects/models/effectModels");

const accountAccess = require('./account-access');

// Connection Dependency Checker
// This returns true if all dependency checks pass. IE: If interactive is required and we're connected to interactive.
// NOTE: I don't know of a way to check for overlay status right now so this skips that check.
function validateEffectCanRun(effectId, triggerType) {
    let effectDefinition = effectManager.getEffectById(effectId).definition;

    // Validate trigger
    let supported = effectDefinition.triggers[triggerType] != null && effectDefinition.triggers[triggerType] !== false;
    if (!supported) {
        logger.info(`${effectId} cannot be triggered by: ${triggerType}`);
        return false;
    }

    // Validate Dependancies
    let interactiveStatus = Interactive.getInteractiveStatus();
    let chatStatus = Chat.getChatStatus();

    let validDeps = effectDefinition.dependencies.every(d => {
        if (d === EffectDependency.INTERACTIVE) {
            return interactiveStatus;
        }

        if (d === EffectDependency.CHAT) {
            return chatStatus;
        }

        if (d === EffectDependency.CONSTELLATION) {
            // TODO: update to actually check state of constellation
            return true;
        }

        if (d === EffectDependency.OVERLAY) {
            return true;
        }

        logger.info(`Unknown effect dependancy: ${d}`);
        return false;
    });

    return validDeps;
}

function triggerEffect(effect, trigger) {
    return new Promise((resolve) => {
    // For each effect, send it off to the appropriate handler.
        logger.debug(`Running ${effect.id} effect...`);

        let effectDef = effectManager.getEffectById(effect.id);

        resolve(effectDef.onTriggerEvent({ effect: effect, trigger: trigger }));
    });
}

function runEffects(runEffectsContext) {
    return new Promise(async resolve => {
        let trigger = runEffectsContext.trigger,
            effects = runEffectsContext.effects;

        for (const effect of effects) {
            // Check this effect for dependencies before running.
            // If all dependencies are not fulfilled, we will skip this effect.
            /**
             * TODO: Handle screen controls.
            if (!validateEffectCanRun(effect.id, trigger.type)) {
                logger.info(
                    "Skipping " +
            effect.id +
            ". Dependencies not met or trigger not supported."
                );
                renderWindow.webContents.send("eventlog", {
                    type: "general",
                    username: "System:",
                    event: `Skipped over ${
                        effect.name
                    } due to dependencies or unsupported trigger.`
                });
                continue;
            }
             */

            try {
                let response = await triggerEffect(effect, trigger);
                if (response && response.success === false) {
                    logger.error(
                        `An effect with ID ${effect.id} failed to run.`,
                        response.reason
                    );
                }
            } catch (err) {
                logger.error(
                    `There was an error running effect with ID ${effect.id}`,
                    err
                );
            }
        }

        resolve();
    });
}

function processEffects(processEffectsRequest) {
    return new Promise(resolve => {
        let username = "";
        if (processEffectsRequest.participant) {
            username = processEffectsRequest.participant.username;
        }

        // Add some values to our wrapper
        let runEffectsContext = processEffectsRequest;
        runEffectsContext["username"] = username;

        return resolve(runEffects(runEffectsContext));
    });
}

function runEffectsManually(effects) {
    if (effects == null) return;

    let streamerName = accountAccess.getAccounts().streamer.username || "";

    let processEffectsRequest = {
        trigger: {
            type: EffectTrigger.MANUAL,
            metadata: {
                username: streamerName,
                eventData: {
                    shared: true,
                    totalMonths: 6
                },
                control: {
                    cost: 10,
                    text: "Test Button",
                    cooldown: "30",
                    disabled: false,
                    progress: 0.5,
                    tooltip: "Test tooltip"
                },
                inputData: {
                    value: "@Textbox"
                },
                command: {
                    commandID: "Test Command"
                },
                userCommand: {
                    cmd: {
                        value: "!test"
                    },
                    args: ["@TestArg1", "TestArg2", "@TestArg3", "TestArg4", "@TestArg5"]
                },
                chatEvent: {}
            }
        },
        effects: effects
    };

    processEffects(processEffectsRequest).catch(reason => {
        logger.warn("Error running effects manually", reason);
    });
}

// Manually play a button.
// This listens for an event from the render and will activate a button manually.
ipcMain.on('runEffectsManually', function(event, effects) {
    runEffectsManually(effects);
});

exports.processEffects = processEffects;

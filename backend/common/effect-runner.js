'use strict';
const {ipcMain} = require('electron');
const logger = require('../logwrapper');

const effectManager = require("../effects/effectManager");
const { EffectDependency, EffectTrigger } = require("../effects/models/effectModels");

const accountAccess = require('./account-access');

const replaceVariableManager = require("./../variables/replace-variable-manager");

const effectQueueManager = require("../effects/queues/effect-queue-manager");
const effectQueueRunner = require("../effects/queues/effect-queue-runner");

function getTriggerIdFromTriggerData(trigger) {
    let { eventSource, event } = trigger.metadata;

    if (eventSource && event) {
        return `${eventSource.id}:${event.id}`;
    }

    return undefined;
}

const findAndReplaceVariables = async (data, trigger) => {
    let keys = Object.keys(data);

    for (let key of keys) {

        // skip nested effect lists and conditions so we dont replace variables too early
        if (key === "list" || key === "leftSideValue" || key === "rightSideValue") continue;

        let value = data[key];

        if (value && typeof value === "string") {
            if (value.includes("$")) {
                let replacedValue = value;
                let triggerId = getTriggerIdFromTriggerData(trigger);
                try {
                    replacedValue = await replaceVariableManager.evaluateText(value, trigger, {
                        type: trigger.type,
                        id: triggerId
                    });
                } catch (err) {
                    logger.warn(`Unable to parse variables for value: '${value}'`, err);
                }
                data[key] = replacedValue;
            }
        } else if (value && typeof value === "object") {
            // recurse
            await findAndReplaceVariables(value, trigger);
        }
    }
};

// Connection Dependency Checker
// This returns true if all dependency checks pass.
// NOTE: I don't know of a way to check for overlay status right now so this skips that check.
function validateEffectCanRun(effectId, triggerType) {
    let effectDefinition = effectManager.getEffectById(effectId).definition;

    // Validate trigger
    if (effectDefinition.triggers) {
        let supported = effectDefinition.triggers[triggerType] != null
        && effectDefinition.triggers[triggerType] !== false;
        if (!supported) {
            logger.info(`${effectId} cannot be triggered by: ${triggerType}`);
            return false;
        }
    }


    if (effectDefinition.dependencies) {
        const twitchChat = require("../chat/twitch-chat");
        const validDeps = effectDefinition.dependencies.every(d => {
            if (d === EffectDependency.CHAT) {
                return twitchChat.chatIsConnected();
            }

            if (d === EffectDependency.OVERLAY) {
                return true;
            }

            logger.info(`Unknown effect dependency: ${d}`);
            return false;
        });
        return validDeps;
    }

    return true;

}

async function triggerEffect(effect, trigger) {
    // For each effect, send it off to the appropriate handler.
    logger.debug(`Running ${effect.type}(${effect.id}) effect...`);

    let effectDef = effectManager.getEffectById(effect.type);

    return effectDef.onTriggerEvent({ effect: effect, trigger: trigger });
}

async function runEffects(runEffectsContext) {
    let trigger = runEffectsContext.trigger,
        effects = runEffectsContext.effects.list;

    for (const effect of effects) {
        // Check this effect for dependencies before running.
        // If all dependencies are not fulfilled, we will skip this effect.

        if (!validateEffectCanRun(effect.type, trigger.type)) {
            logger.info(`Skipping ${effect.type}(${effect.id}). Dependencies not met or trigger not supported.`);

            continue;
        }

        // run all strings through replace variable system
        logger.debug("Looking and handling replace variables...");

        await findAndReplaceVariables(effect, trigger);

        try {
            let response = await triggerEffect(effect, trigger);
            if (response === null || response === undefined) continue;
            if (!response || response.success === false) {
                logger.error(`An effect of type ${effect.type} and id ${effect.id} failed to run.`, response.reason);
            } else {
                if (typeof response !== "boolean") {
                    let { execution } = response;
                    if (execution && execution.stop) {
                        logger.info(`Stop effect execution triggered for effect list id ${runEffectsContext.effects.id}`);
                        return {
                            success: true,
                            stopEffectExecution: execution.bubbleStop
                        };
                    }
                }
            }
        } catch (err) {
            logger.error(`There was an error running effect of type ${effect.type} with id ${effect.id}`, err);
        }
    }

    return {
        success: true,
        stopEffectExecution: false
    };
}

async function processEffects(processEffectsRequest) {
    let username = "";
    if (processEffectsRequest.participant) {
        username = processEffectsRequest.participant.username;
    }

    // Add some values to our wrapper
    let runEffectsContext = processEffectsRequest;
    runEffectsContext["username"] = username;

    runEffectsContext.effects = JSON.parse(JSON.stringify(runEffectsContext.effects));

    const queueId = processEffectsRequest.effects.queue;
    const queue = effectQueueManager.getEffectQueue(queueId);
    if (queue != null) {
        logger.debug(`Sending effects for list ${processEffectsRequest.effects.id} to queue ${queueId}...`);
        effectQueueRunner.addEffectsToQueue(queue, runEffectsContext,
            processEffectsRequest.effects.queueDuration, processEffectsRequest.effects.queuePriority);
        return;
    }

    return runEffects(runEffectsContext);
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
exports.runEffects = runEffects;
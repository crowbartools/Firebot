'use strict';
const {ipcMain} = require('electron');
const logger = require('../logwrapper');
const effectManager = require("../effects/effectManager");
const { EffectTrigger } = require("../../shared/effect-constants");
const accountAccess = require('./account-access');
const replaceVariableManager = require("./../variables/replace-variable-manager");
const effectQueueManager = require("../effects/queues/effect-queue-manager");
const effectQueueRunner = require("../effects/queues/effect-queue-runner");
const webServer = require("../../server/http-server-manager");
const util = require("../utility");
const uuid = require("uuid/v4");
const {
    addEffectAbortController,
    removeEffectAbortController
} = require("./effect-abort-helpers");

const SKIP_VARIABLE_PROPERTIES = ["list", "leftSideValue", "rightSideValue", "effectLabel", 'effectListLabel'];

const findAndReplaceVariables = async (data, trigger, effectOutputs) => {
    const keys = Object.keys(data);

    for (const key of keys) {

        // skip nested effect lists and conditions so we don't replace variables too early
        if (SKIP_VARIABLE_PROPERTIES.includes(key)) {
            continue;
        }

        const value = data[key];

        if (value && typeof value === "string") {
            let replacedValue = value;
            const triggerId = util.getTriggerIdFromTriggerData(trigger);
            try {
                replacedValue = await replaceVariableManager.evaluateText(value, {
                    ...trigger,
                    effectOutputs
                }, {
                    type: trigger.type,
                    id: triggerId
                });
            } catch (err) {
                logger.warn(`Unable to parse variables for value: '${value}'`, err);
            }
            data[key] = replacedValue;
        } else if (value && typeof value === "object") {
            // recurse
            await findAndReplaceVariables(value, trigger, effectOutputs);
        }
    }
};

function validateEffectCanRun(effectId, triggerType) {
    const effectDefinition = effectManager.getEffectById(effectId).definition;

    // Validate trigger
    if (effectDefinition.triggers) {
        const supported = effectDefinition.triggers[triggerType] != null
        && effectDefinition.triggers[triggerType] !== false;
        if (!supported) {
            logger.info(`${effectId} cannot be triggered by: ${triggerType}`);
            return false;
        }
    }

    if (effectDefinition.dependencies) {
        // require here to avoid circular dependency issues :(
        const { checkEffectDependencies } = require("../effects/effect-helpers");
        const depsMet = checkEffectDependencies(effectDefinition.dependencies, "execution", true);
        if (!depsMet) {
            return false;
        }
    }

    return true;
}

function triggerEffect(effect, trigger, outputs, manualAbortSignal, listAbortSignal) {
    return new Promise(async (resolve, reject) => {
        const effectDef = effectManager.getEffectById(effect.type);

        const allSignals = [manualAbortSignal];

        const timeout = effect.abortTimeout ? effect.abortTimeout * 1000 : 0;
        if (!effectDef.definition.exemptFromTimeouts && timeout > 0) {
            allSignals.push(AbortSignal.timeout(timeout));
        }

        const signal = AbortSignal.any(allSignals);

        if (signal.aborted) {
            return reject(signal.reason);
        }

        signal.addEventListener("abort", () => {
            reject(signal.reason);
        });

        const sendDataToOverlay = (data, overlayInstance) => {
            const overlayEventName = effectDef.overlayExtension?.event?.name;
            if (overlayEventName) {
                webServer.sendToOverlay(overlayEventName, data, overlayInstance);
            }
        };

        logger.debug(`Running ${effect.type}(${effect.id}) effect...`);

        const result = await effectDef.onTriggerEvent({
            effect,
            trigger,
            sendDataToOverlay,
            outputs,
            abortSignal: AbortSignal.any([signal, listAbortSignal])
        });

        if (!signal.aborted) {
            return resolve(result);
        }
    });
}

function runEffects(runEffectsContext) {
    return new Promise(async (resolve) => {
        runEffectsContext = structuredClone(runEffectsContext);

        runEffectsContext.executionId = uuid();

        const trigger = runEffectsContext.trigger,
            effects = runEffectsContext.effects.list;

        const effectListAbortController = new AbortController();

        addEffectAbortController("effect-list", runEffectsContext.effects.id, {
            executionId: runEffectsContext.executionId,
            abortController: effectListAbortController
        });

        effectListAbortController.signal.addEventListener("abort", () => {
            const { message, bubbleStop } = effectListAbortController.signal.reason ?? {};

            logger.info(`Effect list ${runEffectsContext.effects.id} was aborted. Reason: ${message}`);

            removeEffectAbortController(
                "effect-list",
                runEffectsContext.effects.id,
                runEffectsContext.executionId
            );

            resolve({
                success: true,
                stopEffectExecution: !!bubbleStop,
                outputs: runEffectsContext.outputs ?? {}
            });
        });

        for (const effect of effects) {
            if (effectListAbortController.signal.aborted) {
                return;
            }

            if (effect.active != null && !effect.active) {
                logger.info(`${effect.type}(${effect.id}) is disabled, skipping...`);
                continue;
            }

            // Check this effect for dependencies before running.
            // If any dependencies are not available, we will skip this effect.
            if (!validateEffectCanRun(effect.type, trigger.type)) {
                logger.info(`Skipping ${effect.type}(${effect.id}). Dependencies not met or trigger not supported.`);
                continue;
            }

            // run all strings through replace variable system
            logger.debug("Looking and handling replace variables...");

            await findAndReplaceVariables(effect, trigger, Object.freeze({
                ...(runEffectsContext.outputs ?? {})
            }));

            try {
                const effectExecutionId = uuid();
                const effectAbortController = new AbortController();

                addEffectAbortController("effect", effect.id, {
                    executionId: effectExecutionId,
                    abortController: effectAbortController
                });

                const response = await triggerEffect(
                    effect,
                    trigger,
                    runEffectsContext.outputs,
                    effectAbortController.signal,
                    effectListAbortController.signal
                );

                removeEffectAbortController("effect", effect.id, effectExecutionId);

                if (!response || effectAbortController.signal.aborted) {
                    continue;
                }
                if (!response || response.success === false) {
                    logger.error(`An effect of type ${effect.type} and id ${effect.id} failed to run.`, response.reason);
                } else {
                    if (typeof response !== "boolean") {
                        const { outputs, execution } = response;

                        if (outputs) {
                            Object.entries(outputs).forEach(([defaultName, value]) => {
                                const outputNames = effect.outputNames ?? {};
                                const name = outputNames[defaultName] ?? defaultName;
                                runEffectsContext.outputs[name] = value;
                            });
                        }

                        if (execution?.stop) {
                            logger.info(`Stop effect execution triggered for effect list id ${runEffectsContext.effects.id}`);

                            removeEffectAbortController(
                                "effect-list",
                                runEffectsContext.effects.id,
                                runEffectsContext.executionId
                            );

                            return resolve({
                                success: true,
                                stopEffectExecution: execution.bubbleStop,
                                outputs: runEffectsContext.outputs ?? {}
                            });
                        }
                    }
                }
            } catch (err) {
                if (err.name === "AbortError") {
                    logger.info(`Effect ${effect.id} (${effect.type}) was aborted manually.`);
                } else if (err.name === "TimeoutError") {
                    logger.warn(`Effect ${effect.id} (${effect.type}) timed out.`);
                } else {
                    logger.error(`There was an error running effect of type ${effect.type} with id ${effect.id}`, err);
                }
            }
        }

        removeEffectAbortController(
            "effect-list",
            runEffectsContext.effects.id,
            runEffectsContext.executionId
        );

        return resolve({
            success: true,
            stopEffectExecution: false,
            outputs: runEffectsContext.outputs ?? {}
        });
    });
}

async function processEffects(processEffectsRequest) {
    let username = "";
    if (processEffectsRequest.participant) {
        username = processEffectsRequest.participant.username;
    }

    // Add some values to our wrapper
    const runEffectsContext = processEffectsRequest;
    runEffectsContext["username"] = username;

    runEffectsContext.effects = structuredClone(runEffectsContext.effects);

    if (runEffectsContext.outputs == null) {
        runEffectsContext.outputs = {};
    }

    const queueId = processEffectsRequest.effects.queue;
    const queue = effectQueueManager.getItem(queueId);
    if (queue != null) {
        logger.debug(`Sending effects for list ${processEffectsRequest.effects.id} to queue ${queueId}...`);
        effectQueueRunner.addEffectsToQueue(queue, runEffectsContext,
            processEffectsRequest.effects.queueDuration, processEffectsRequest.effects.queuePriority);
        return;
    }

    return runEffects(runEffectsContext);
}

function runEffectsManually(effects, metadata = {}, triggerType = EffectTrigger.MANUAL) {
    if (effects == null) {
        return;
    }

    const streamerName = accountAccess.getAccounts().streamer.username || "";

    const processEffectsRequest = {
        trigger: {
            type: triggerType,
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
                chatEvent: {},
                ...metadata
            }
        },
        effects: effects
    };

    processEffects(processEffectsRequest).catch((reason) => {
        logger.warn("Error running effects manually", reason);
    });
}

// Manually play a button.
// This listens for an event from the render and will activate a button manually.
ipcMain.on('runEffectsManually', function(event, {effects, metadata, triggerType}) {
    runEffectsManually(effects, metadata, triggerType);
});

exports.processEffects = processEffects;
exports.runEffects = runEffects;
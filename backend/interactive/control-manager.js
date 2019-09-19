"use strict";
const mixplayProjectManager = require("./mixplay-project-manager");
const mixplay = require("./mixplay");

const effectManager = require("../effects/effectManager");
const effectRunner = require("../common/effect-runner");
const sparkExemptManager = require("./helpers/sparkExemptManager");
const restrictionsManager = require("../restrictions/restriction-manager");
const { TriggerType } = require("../common/EffectType");
const { settings } = require('../common/settings-access');
const userDatabase = require("../database/userDatabase.js");
const cooldownManager = require("./cooldown-manager");
const logger = require("../logwrapper");

const mixerChat = require("../common/mixer-chat");

function getConnectedProject() {
    const connectedProjectId = mixplayProjectManager.getConnectedProjectId();

    return mixplayProjectManager.getProjectById(connectedProjectId);
}

function getControlById(controlId, projectId) {
    let currentProject = mixplayProjectManager.getProjectById(projectId);
    if (currentProject) {
        let scenes = currentProject.scenes;
        if (scenes) {
            for (let scene of scenes) {
                if (scene.controls) {
                    for (let control of scene.controls) {
                        if (control.id === controlId) {
                            return control;
                        }
                    }
                }
            }
        }
    }
    return null;
}

async function handleInput(inputType, sceneId, inputEvent, participant) {
    const connectedProject = getConnectedProject();

    if (connectedProject == null) {
        return;
    }

    const inputData = inputEvent.input;

    let control;
    for (const scene of connectedProject.scenes) {
        control = scene.controls.find(c => c.id === inputData.controlID);
        if (control != null) {
            break;
        }
    }

    if (!control) {
        return;
    }

    console.log(participant);

    let triggerData = {
        type: TriggerType.INTERACTIVE,
        metadata: {
            username: participant.username,
            userId: participant.userID,
            userMixerRoles: participant.channelGroups,
            participant: participant,
            control: control,
            inputData: inputData,
            inputType: inputType
        }
    };

    // Handle restrictions
    if (control.restrictions) {
        if (inputType !== "mouseup" && inputType !== "keyup") {
            try {
                await restrictionsManager.runRestrictionPredicates(triggerData, control.restrictions);
            } catch (restrictionReason) {
                logger.debug(`${participant.username} could not use control '${control.name}' because: ${restrictionReason}`);
                mixerChat.smartSend("You cannot use this control because: " + restrictionReason, participant.username);
                return;
            }
        }
    }

    // Handle any cooldowns
    if (control.kind === "button" || control.kind === "textbox") {
        if (inputType !== "mouseup" && inputType !== "keyup") {
            const alreadyOnCooldown = cooldownManager.handleControlCooldown(control);
            if (alreadyOnCooldown) {
                logger.info("Control " + control.id + " is still on cooldown. Ignoring press.");
                return;
            }
        }
    }

    if (control.effects && control.effects.list) {
        let effectsForInputType = control.effects.list.filter(e => effectManager.effectSupportsInputType(e.type, inputType));

        if (effectsForInputType.length > 0) {
            let processEffectsRequest = {
                trigger: triggerData,
                effects: control.effects
            };

            // Increment Total Interactions for User in UserDB.
            if (inputType === "mousedown") {
                userDatabase.incrementDbField(
                    participant.userID,
                    "mixplayInteractions"
                );
            }

            effectRunner.processEffects(processEffectsRequest).catch(reason => {
                console.log("error when running effects: " + reason);
            });

            // Charge sparks for the button that was pressed.
            // Note this will fire even if the threshold hasnt passed. People pay to build up to the goal.
            if (inputEvent.transactionID) {
                logger.info("control has sparks, checking for spark exemption and charging sparks if not exempt");
                try {
                    if (sparkExemptManager.sparkExemptionEnabled()) {
                        logger.info("Spark exemption is enabled, checking for selected users or groups");
                        if (sparkExemptManager.hasExemptUsersOrGroups()) {
                            logger.info("We have exempt users or groups, checking spark exempt status...");

                            let exempt = sparkExemptManager.userIsExempt(participant);
                            if (exempt === true) {
                                // they are exempt, charging sparks
                                logger.info("User is exempt. Not charging sparks.");
                                renderWindow.webContents.send('eventlog', {type: "general", username: 'System', event: participant.username + " appears to be spark exempt. Not charging sparks. Disable Spark Exemptions in Settings > Interactive if this is not what you want."});
                                return;
                            }
                        } else {
                            logger.info("No Spark Exempt users or groups saved. Skipping check.");
                        }
                    } else {
                        logger.info("Spark exemption is disabled.");
                    }
                } catch (err) {
                    logger.error("There was an error checking spark exempt data. Charging sparks...", err);
                }

                // we made it to here, charge those sparks.
                mixplay.client.captureTransaction(inputEvent.transactionID);

                logger.info("User not spark exempt. Captured transaction to charge sparks for " + participant.username);
                renderWindow.webContents.send('eventlog', {type: "general", username: 'System', event: participant.username + " pressed a button with sparks. They have been charged."});
            } else {
                logger.info("This control doesnt appear to have sparks associated to it.");
            }
        }
    }
}

exports.handleInput = handleInput;
exports.getControlById = getControlById;
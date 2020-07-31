"use strict";
const mixplayProjectManager = require("./mixplay-project-manager");
const mixplay = require("./mixplay");
const activeMixplayUsers = require('../roles/role-managers/active-mixplay-users');

const effectManager = require("../effects/effectManager");
const effectRunner = require("../common/effect-runner");
const restrictionsManager = require("../restrictions/restriction-manager");
const { TriggerType } = require("../common/EffectType");
const { settings } = require('../common/settings-access');
const userDatabase = require("../database/userDatabase.js");
const cooldownManager = require("./cooldown-manager");
const logger = require("../logwrapper");

const chat = require ("../chat/twitch-chat");

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

    let mixplayControl = await mixplay.client.state.getControl(control.id);

    let triggerData = {
        type: TriggerType.INTERACTIVE,
        metadata: {
            username: participant.username,
            userId: participant.userID,
            userMixerRoles: participant.channelGroups,
            participant: participant,
            control: mixplayControl,
            inputData: inputData,
            inputType: inputType
        }
    };

    // Handle restrictions
    if (control.restrictionData) {
        if (inputType !== "mouseup" && inputType !== "keyup") {
            try {
                await restrictionsManager.runRestrictionPredicates(triggerData, control.restrictionData);
            } catch (restrictionReason) {
                let reason;
                if (Array.isArray(restrictionReason)) {
                    reason = restrictionReason.join(", ");
                } else {
                    reason = restrictionReason;
                }
                logger.debug(`${participant.username} could not use control '${control.name}' because: ${reason}`);
                chat.sendChatMessage("You cannot use this control because: " + reason, participant.username);
                return;
            }
        }
    }

    // Handle any cooldowns
    if (control.kind === "button" || control.kind === "textbox") {
        if (inputType !== "mouseup" && inputType !== "keyup") {
            const alreadyOnCooldown = await cooldownManager.handleControlCooldown(control);
            if (alreadyOnCooldown) {
                logger.debug("Control " + control.id + " is still on cooldown. Ignoring press.");
                return;
            }
        }
    }

    if (control.effects && control.effects.list) {
        let effectsForInputType = control.effects.list
            .filter(e => effectManager.effectSupportsInputType(e.type, inputType));

        if (effectsForInputType.length > 0) {
            let processEffectsRequest = {
                trigger: triggerData,
                effects: {
                    id: control.effects.id,
                    queue: control.effects.queue,
                    list: effectsForInputType
                }
            };

            if (inputType === "mousedown" && !participant.anonymous) {
                // Increment Total Interactions for User in UserDB.
                userDatabase.incrementDbField(
                    participant.userID,
                    "mixplayInteractions"
                );

                activeMixplayUsers.addOrUpdateActiveUser(participant);
            }

            effectRunner.processEffects(processEffectsRequest).catch(reason => {
                console.log("error when running effects: " + reason);
            });

            if (control.chatFeedAlert === true) {
                renderWindow.webContents.send("chatUpdate", {
                    fbEvent: "ChatAlert",
                    message: participant.username + " used the MixPlay control '" + control.name + "'."
                });
            }

            // Charge sparks for the button that was pressed.
            // Note this will fire even if the threshold hasnt passed. People pay to build up to the goal.
            if (inputEvent.transactionID) {

                // we made it to here, charge those sparks.
                mixplay.client.captureTransaction(inputEvent.transactionID);

                logger.debug("User not spark exempt. Captured transaction to charge sparks for " + participant.username);
                renderWindow.webContents.send('eventlog', {type: "general", username: 'System', event: participant.username + " pressed a button with sparks. They have been charged."});
            } else {
                logger.debug("This control doesnt appear to have sparks associated to it.");
            }
        }
    }
}

exports.handleInput = handleInput;
exports.getControlById = getControlById;

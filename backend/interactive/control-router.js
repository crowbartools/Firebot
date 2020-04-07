"use strict";

const { ipcMain } = require("electron");
const mixerInteractive = require("../common/mixer-interactive");
const cooldowns = require("./cooldowns.js");
const threshold = require("./threshold.js");
const permissions = require("./permissions.js");
const sparkExemptManager = require("./helpers/sparkExemptManager.js");
const { TriggerType } = require("../common/EffectType");
const logger = require("../logwrapper");
const userDatabase = require("../database/userDatabase.js");

// Handlers
const controlHandler = require("../common/handlers/controlEmulation/controlProcessor.js");
const effectRunner = require("../common/effect-runner.js");

// Auto Play
// This function will activate a button when triggered through mixer..
function autoPlay(processEffectsRequest) {
    // Run the effects
    effectRunner.processEffects(processEffectsRequest).then(function() {
    // This is called after the effects are done running.
    });
}

// Control Router
// This function takes in every button press and routes the info to the right destination.
async function controlRouter(
    inputevent,
    mixerControls,
    mixerControl,
    gameJson,
    inputEvent,
    participant
) {
    let controlID = inputEvent.input.controlID;
    let firebot = gameJson.firebot;

    if (firebot.controls[controlID] == null) {
        logger.debug(`No firebot control data saved for: ${controlID}`);
        return;
    }

    let control = firebot.controls[controlID];
    let effects = control.effects;

    logger.debug("beginning control routing for control: " + controlID);

    // Create request wrapper (instead of having to pass in a ton of args)
    let processEffectsRequest = {
        trigger: {
            type: TriggerType.INTERACTIVE,
            metadata: {
                username: participant.username,
                userId: participant.userID,
                participant: participant,
                control: control,
                mixerControl: await mixerInteractive.getButtonById(controlID),
                inputData: inputEvent.input
            }
        },
        effects: effects
    };

    logger.debug("checking input event: " + inputevent);
    // Check to see if this is a mouse down or mouse up event.
    if (inputevent !== "mouseup" && inputevent !== "keyup") {
    // Mouse Down event called.

        logger.debug("Checking permissions");
        // First lets test to see if this person has permission to use this button.
        permissions.router(participant, control)
            .then(() => {

                logger.debug("Checking cooldowns");
                // Make sure cooldowns is processed.
                cooldowns.router(mixerControls, mixerControl, firebot, control)
                    .then(() => {

                        logger.debug("Checking threshold");
                        // Next see if we've crossed our threshold to activate if there is one.
                        threshold.router(control)
                            .then(() => {

                                logger.debug("Playing effects");
                                // All tests passed! Let's run the effects.
                                autoPlay(processEffectsRequest);

                                // Throw this button info into UI log.
                                if (control.skipLog !== true) {
                                    renderWindow.webContents.send('eventlog', {type: "general", username: participant.username, event: "pressed the " + controlID + " button."});
                                }

                                // Throw chat alert if we have it active.
                                if (control.chatFeedAlert === true) {
                                    renderWindow.webContents.send('chatUpdate', {fbEvent: "ChatAlert", message: participant.username + " pressed the " + controlID + " button."});
                                }

                                // Increment Total Interactions for User in UserDB.
                                userDatabase.incrementDbField(
                                    participant.userID,
                                    "mixplayInteractions"
                                );
                            })
                            .catch(() => {
                                // Throw this button info into UI log.
                                if (control.skipLog !== true) {
                                    renderWindow.webContents.send('eventlog', {type: "general", username: participant.username, event: "tried to press " + controlID + " but it has not passed its threshold."});
                                }
                            })
                            .then(() => {
                                // Charge sparks for the button that was pressed.
                                // Note this will fire even if the threshold hasnt passed. People pay to build up to the goal.
                                if (inputEvent.transactionID) {
                                    logger.debug("control has sparks, checking for spark exemption and charging sparks if not exempt");
                                    try {
                                        if (sparkExemptManager.sparkExemptionEnabled()) {
                                            logger.debug("Spark exemption is enabled, checking for selected users or groups");
                                            if (sparkExemptManager.hasExemptUsersOrGroups()) {
                                                logger.debug("We have exempt users or groups, checking spark exempt status...");

                                                let exempt = sparkExemptManager.userIsExempt(participant);
                                                if (exempt === true) {
                                                    // they are exempt, charging sparks
                                                    logger.debug("User is exempt. Not charging sparks.");
                                                    renderWindow.webContents.send('eventlog', {type: "general", username: 'System', event: participant.username + " appears to be spark exempt. Not charging sparks. Disable Spark Exemptions in Settings > Interactive if this is not what you want."});
                                                    return;
                                                }
                                            } else {
                                                logger.debug("No Spark Exempt users or groups saved. Skipping check.");
                                            }
                                        } else {
                                            logger.debug("Spark exemption is disabled.");
                                        }
                                    } catch (err) {
                                        logger.error("There was an error checking spark exempt data. Charging sparks...", err);
                                    }

                                    // we made it to here, charge those sparks.
                                    mixerInteractive.sparkTransaction(inputEvent.transactionID);

                                    logger.debug("User not spark exempt. Captured transaction to charge sparks for " + participant.username);
                                    renderWindow.webContents.send('eventlog', {type: "general", username: 'System', event: participant.username + " pressed a button with sparks. They have been charged."});
                                } else {
                                    logger.debug("This control doesnt appear to have sparks associated to it.");
                                }
                            });
                    })
                    .catch(() => {
                        logger.debug('Button is still on cooldown. Ignoring button press.');

                        // Throw this button info into UI log.
                        if (control.skipLog !== true) {
                            renderWindow.webContents.send('eventlog', {type: "general", username: participant.username, event: "tried to press " + controlID + " but it is on cooldown."});
                        }
                    });
            });
    } else {
    // Mouse/key up event called.
    // Right now this is only used by game controls to know when to lift keys up.

        // Loop through effects for this button.
        // LOOPS: object
        if (effects == null) {
            return;
        }

        let effectsArray = [];
        if (Array.isArray(effects)) {
            effectsArray = effects;
        } else {
            effectsArray = Object.values(effects);
        }

        for (let effect of effectsArray) {
            let effectType = effect.type;

            // See if the effect is game control.
            if (effectType === "Game Control") {
                controlHandler.press("mouseup", effect, control);
            }
        }
    }
}

// Manual Play
// This function will active a button when it is manually triggered via the ui.
function manualPlay(controlID) {
    // Get current controls board and set vars.
    try {
        let interactiveCache = mixerInteractive.getInteractiveCache();
        let controls = interactiveCache["firebot"].controls;
        let control = controls[controlID];

        let effects = control.effects;

        // Create request wrapper (instead of having to pass in a ton of args)
        // Make sure we specify isManual as true
        let processEffectsRequest = {
            trigger: {
                type: TriggerType.MANUAL,
                metadata: {
                    control: control,
                    username: "Streamer"
                }
            },
            effects: effects
        };

        // Run the effects
        effectRunner.processEffects(processEffectsRequest).then(function() {
            // This is called after the effects are done running.
        });

        // Throw this information into the moderation panel.
        if (control.skipLog !== true) {
            renderWindow.webContents.send("eventlog", {
                type: "general",
                username: "You",
                event: "manually pressed the " + controlID + " button."
            });
        }

        // Throw chat alert if we have it active.
        if (control.chatFeedAlert === true) {
            renderWindow.webContents.send("chatUpdate", {
                fbEvent: "ChatAlert",
                message: "You manually pressed the " + controlID + " button."
            });
        }
    } catch (err) {
        renderWindow.webContents.send(
            "error",
            "There was an error trying to manually activate this button. " + err
        );
        logger.error(err);
        return;
    }
}

// Manually play a button.
// This listens for an event from the render and will activate a button manually.
ipcMain.on("manualButton", function(event, controlID) {
    manualPlay(controlID);
});

// Export Functions
exports.router = controlRouter;

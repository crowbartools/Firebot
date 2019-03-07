"use strict";
const mixplayProjectManager = require("./mixplay-project-manager");

const effectRunner = require("../common/effect-runner");
const { TriggerType } = require("../common/EffectType");

async function handleInput(inputType, sceneId, inputData, participant) {

    if (inputType !== "mousedown" || inputType !== "submit") return;

    const connectedProjectId = mixplayProjectManager.getConnectedProjectId();

    const connectedProject = mixplayProjectManager.getProjectById(connectedProjectId);


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

    let processEffectsRequest = {
        trigger: {
            type: TriggerType.INTERACTIVE,
            metadata: {
                username: participant.username,
                userId: participant.userID,
                participant: participant,
                control: control,
                inputData: inputData,
                inputType: inputType
            }
        },
        effects: control.effects
    };

    effectRunner.processEffects(processEffectsRequest).catch(reason => {
        console.log("error when running effects: " + reason);
    });
}

exports.handleInput = handleInput;
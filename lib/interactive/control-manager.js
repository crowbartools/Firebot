"use strict";
const mixplayProjectManager = require("./mixplay-project-manager");

const effectManager = require("../effects/effectManager");
const effectRunner = require("../common/effect-runner");
const { TriggerType } = require("../common/EffectType");

async function handleInput(inputType, sceneId, inputData, participant) {

    const connectedProjectId = mixplayProjectManager.getConnectedProjectId();

    const connectedProject = mixplayProjectManager.getProjectById(connectedProjectId);

    if (connectedProject == null) {
        return;
    }

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

    let effects = control.effects.filter(e => effectManager.effectSupportsInputType(e.id, inputType));

    if (effects.length > 0) {
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
            effects: effects
        };

        effectRunner.processEffects(processEffectsRequest).catch(reason => {
            console.log("error when running effects: " + reason);
        });
    }
}

exports.handleInput = handleInput;
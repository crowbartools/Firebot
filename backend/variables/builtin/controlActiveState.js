"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const mixplayProjectManager = require("../../interactive/mixplay-project-manager");
const mixplay = require("../../interactive/mixplay");

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;

const model = {
    definition: {
        handle: "controlActiveState",
        description: "The control's active state (true/false).",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger, controlName, sceneName) => {

        let control = trigger.metadata.control;

        if (controlName != null && sceneName != null) {
            let projectControl = mixplayProjectManager.getControlByNameAndScene(controlName, sceneName);
            if (projectControl != null) {
                control = mixplay.client.state.getControl(projectControl.id);
            }
        }

        if (control === undefined || control === null) {
            return true;
        }

        return !control.disabled;
    }
};

module.exports = model;

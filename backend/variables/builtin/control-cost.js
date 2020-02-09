"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");
const { ControlKind } = require('../../interactive/constants/MixplayConstants');

const mixplayProjectManager = require("../../interactive/mixplay-project-manager");
const mixplay = require("../../interactive/mixplay");

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;
triggers[EffectTrigger.INTERACTIVE] = [ControlKind.BUTTON, ControlKind.TEXTBOX];

const model = {
    definition: {
        handle: "controlSparkCost",
        description: "The control's spark cost.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger, controlName, sceneName) => {
        let control = trigger.metadata.control;

        if (controlName != null && sceneName != null) {
            let projectControl = mixplayProjectManager.getControlByNameAndScene(controlName, sceneName);
            if (projectControl != null) {
                control = mixplay.client.state.getControl(projectControl.id);
            }
        }

        if (control == null) {
            return 0;
        }

        return control.cost;
    }
};

module.exports = model;

"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");
const { ControlKind } = require('../../interactive/constants/MixplayConstants');

const mixplayProjectManager = require("../../interactive/mixplay-project-manager");
const mixplay = require("../../interactive/mixplay");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = [ControlKind.BUTTON];

const model = {
    definition: {
        handle: "controlText",
        description: "The control's text.",
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

        if (control == null) {
            return "[Control Not Found]";
        }

        return control.text;
    }
};

module.exports = model;

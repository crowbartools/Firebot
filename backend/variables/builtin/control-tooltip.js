"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

const mixplayProjectManager = require("../../interactive/mixplay-project-manager");
const mixplay = require("../../interactive/mixplay");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;

const model = {
    definition: {
        handle: "controlTooltip",
        description: "The control's tooltip.",
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

        return control.tooltip;
    }
};

module.exports = model;

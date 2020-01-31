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
        handle: "controlProgress",
        description: "The control's progress bar percentage.",
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

        let progress = control.progress;
        return progress ? progress * 100 : 0;
    }
};

module.exports = model;

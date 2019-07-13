"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");
const { ControlKind } = require('../../interactive/constants/MixplayConstants');

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
    evaluator: (trigger) => {
        return trigger.metadata.control && trigger.metadata.control.mixplay.cost;
    }
};

module.exports = model;

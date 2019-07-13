"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;

const model = {
    definition: {
        handle: "controlText",
        description: "The control's text.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.control.mixplay.text;
    }
};

module.exports = model;

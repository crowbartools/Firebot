"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

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
    evaluator: (trigger) => {
        return !trigger.metadata.control.disabled;
    }
};

module.exports = model;

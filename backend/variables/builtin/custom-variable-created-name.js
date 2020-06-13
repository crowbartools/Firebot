"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["firebot:custom-variable-set"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "createdCustomVariableName",
        description: "Name of the created custom variable.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.createdCustomVariableName || "";
    }
};

module.exports = model;

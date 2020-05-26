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
        handle: "setCustomVariableData",
        description: "Data from the created custom variable.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const setCustomVariableData = trigger.metadata.eventData.setCustomVariableData;

        return setCustomVariableData;
    }
};

module.exports = model;

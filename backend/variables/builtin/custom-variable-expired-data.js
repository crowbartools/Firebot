"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["firebot:custom-variable-expired"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "expiredCustomVariableData",
        description: "Data from the expired custom variable.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const expiredCustomVariableData = trigger.metadata.eventData.expiredCustomVariableData;

        return expiredCustomVariableData;
    }
};

module.exports = model;

// Migration: todo - Needs implementation details

"use strict";
const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.EVENT] = ["twitch:timeout"];

const model = {
    definition: {
        handle: "timeoutDuration",
        description: "How long the user is timed out for in minus",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.timeoutDuration || 0;
    }
};

module.exports = model;

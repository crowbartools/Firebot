"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:host"];
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.MANUAL] = true;


const model = {
    definition: {
        handle: "hostType",
        description: "Get the type of host ('manual' or 'auto')",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger) => {
        return trigger.metadata.eventData.auto ? 'auto' : 'manual';
    }
};

module.exports = model;

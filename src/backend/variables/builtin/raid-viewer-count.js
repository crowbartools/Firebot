"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:raid"];
triggers[EffectTrigger.MANUAL] = true;


const model = {
    definition: {
        handle: "raidViewerCount",
        description: "Get the number of viewers brought over by a raid",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger) => {
        return trigger.metadata.eventData.viewerCount || 0;
    }
};

module.exports = model;

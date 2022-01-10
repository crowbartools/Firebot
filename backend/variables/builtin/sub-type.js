"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:sub", "twitch:prime-sub-upgraded"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "subType",
        description: "The type of sub (ie Tier 1, 2, 3, etc).",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        switch (trigger.metadata.eventData.subPlan) {
        case "Prime":
            return "Prime";
        case "1000":
            return "Tier 1";
        case "2000":
            return "Tier 2";
        case "3000":
            return "Tier 3";
        }

        return "";
    }
};

module.exports = model;

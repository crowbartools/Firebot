"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:sub", "twitch:prime-sub-upgraded"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "subType",
        description: "The type of subscription (Tier 1, Tier 2, Tier 3, Prime)",
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

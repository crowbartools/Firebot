"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:banned", "twitch:timeout"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "modReason",
        description: "The reason why the user was banned or timed out.",
        triggers: triggers,
        categories: [VariableCategory.USER, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.text]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.modReason;
    }
};

module.exports = model;

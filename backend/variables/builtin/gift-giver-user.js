"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:subs-gifted", "twitch:community-subs-gifted", "twitch:gift-sub-upgraded"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "giftGiverUsername",
        description: "The name of the user who gifted a sub(s).",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const gifterUsername = trigger.metadata.eventData.gifterUsername;
        return gifterUsername || "UnknownUser";
    }
};

module.exports = model;

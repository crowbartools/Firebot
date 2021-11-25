"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:subs-gifted", "twitch:community-subs-gifted", "twitch:gift-sub-upgraded"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "giftGiverUsername",
        description: "The name of the user who gifted a sub(s).",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let gifterUsername = trigger.metadata.eventData.gifterUsername;
        return gifterUsername || "UnknownUser";
    }
};

module.exports = model;

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:banned", "twitch:timeout"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "moderator",
        description: "The name of the moderator that performed the action (ban or timeout).",
        triggers: triggers,
        categories: [VariableCategory.USER, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.text]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.moderator;
    }
};

module.exports = model;

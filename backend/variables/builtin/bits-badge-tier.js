"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:bits-badge-unlocked"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "bitsBadgeTier",
        description: "The tier of the bits badge that was unlocked (100, 1000, 5000, etc.).",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        let badgeTier = trigger.metadata.eventData.badgeTier || 0;
        return badgeTier;
    }
};

module.exports = model;

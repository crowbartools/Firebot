"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:redemption"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsCardRarity",
        description: "The rarity of a StreamLoots Card.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.INTEGRATION],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const rarity = trigger.metadata.eventData && trigger.metadata.eventData.cardRarity;

        return rarity || "";
    }
};

module.exports = model;

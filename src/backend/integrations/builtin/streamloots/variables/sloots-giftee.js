"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsGiftee",
        description: "The person who was gifted StreamLoots Chests.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.INTEGRATION],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const giftee = trigger.metadata.eventData && trigger.metadata.eventData.giftee;

        return giftee || "";
    }
};

module.exports = model;

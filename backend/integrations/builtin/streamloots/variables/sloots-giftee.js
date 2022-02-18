"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsGiftee",
        description: "The person who was gifted StreamLoots Chests.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let giftee = trigger.metadata.eventData && trigger.metadata.eventData.giftee;

        return giftee || "";
    }
};

module.exports = model;

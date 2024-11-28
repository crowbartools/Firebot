"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase", "streamloots:redemption"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsMessage",
        description: "The users message included with a StreamLoots Chest/Card.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.INTEGRATION],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const message = trigger.metadata.eventData && trigger.metadata.eventData.message;

        return message || "";
    }
};

module.exports = model;

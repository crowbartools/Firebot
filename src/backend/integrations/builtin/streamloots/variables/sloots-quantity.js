"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsChestQuantity",
        description: "The number of purchased StreamLoots Chests.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.INTEGRATION],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        const quantity = trigger.metadata.eventData && trigger.metadata.eventData.quantity;

        return quantity || "";
    }
};

module.exports = model;

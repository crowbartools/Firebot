"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType } = require("../../../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsChestQuantity",
        description: "The number of purchased StreamLoots Chests.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        let quantity = trigger.metadata.eventData && trigger.metadata.eventData.quantity;

        return quantity || "";
    }
};

module.exports = model;

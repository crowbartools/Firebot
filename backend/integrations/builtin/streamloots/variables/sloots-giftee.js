"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType } = require("../../../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsGiftee",
        description: "The person who was gifted StreamLoots Chests.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let giftee = trigger.metadata.eventData && trigger.metadata.eventData.giftee;

        return giftee || "";
    }
};

module.exports = model;

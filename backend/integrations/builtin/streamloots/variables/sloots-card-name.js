"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType } = require("../../../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:redemption"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsCardName",
        description: "The name of a StreamLoots Card.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let cardName = trigger.metadata.eventData && trigger.metadata.eventData.cardName;

        return cardName || "";
    }
};

module.exports = model;

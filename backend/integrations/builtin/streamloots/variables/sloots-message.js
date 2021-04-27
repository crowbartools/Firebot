"use strict";

const { EffectTrigger } = require("../../../../effects/models/effectModels");
const { OutputDataType } = require("../../../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase", "streamloots:redemption"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsMessage",
        description: "The message included with a StreamLoots Chest/Card.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let message = trigger.metadata.eventData && trigger.metadata.eventData.message;

        return message || "";
    }
};

module.exports = model;

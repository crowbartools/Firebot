"use strict";

const { EffectTrigger } = require("../../../../effects/models/effectModels");
const { OutputDataType } = require("../../../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamlabs:donation", "streamlabs:eldonation"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slDonator",
        description: "The username of who sent the StreamLabs/ExtraLife donation.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const from = trigger.metadata.eventData && trigger.metadata.eventData.from;

        if (from == null) {
            return "Unknown User";
        }

        return from;
    }
};

module.exports = model;

"use strict";

const { EffectTrigger } = require("../../../../effects/models/effectModels");
const { OutputDataType } = require("../../../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamlabs:donation", "streamlabs:eldonation"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slDonationMessage",
        description: "The message included with a StreamLabs/ExtraLife donation.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const donationMessage = trigger.metadata.eventData && trigger.metadata.eventData.donationMessage;

        if (donationMessage == null) {
            return "A donation message";
        }

        return donationMessage;
    }
};

module.exports = model;

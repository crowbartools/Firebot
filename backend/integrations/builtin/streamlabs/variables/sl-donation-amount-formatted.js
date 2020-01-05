"use strict";

const { EffectTrigger } = require("../../../../effects/models/effectModels");
const { OutputDataType } = require("../../../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamlabs:donation", "streamlabs:eldonation"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slDonationAmountFormatted",
        description: "The amount of the donation from StreamLabs/ExtraLife formatted with the correct currency symbol.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let formattedDonationAmount = trigger.metadata.eventData && trigger.metadata.eventData.formattedDonationAmount;

        if (formattedDonationAmount == null) {
            return "$10.00";
        }

        return formattedDonationAmount;
    }
};

module.exports = model;

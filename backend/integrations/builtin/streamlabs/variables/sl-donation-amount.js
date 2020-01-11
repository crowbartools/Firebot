"use strict";

const { EffectTrigger } = require("../../../../effects/models/effectModels");
const { OutputDataType } = require("../../../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamlabs:donation", "streamlabs:eldonation"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slDonationAmount",
        description: "The amount of the donation from StreamLabs/ExtraLife",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        let eventData = trigger.metadata.eventData;

        if (eventData == null) {
            return 10;
        }

        return eventData.dononationAmount;
    }
};

module.exports = model;

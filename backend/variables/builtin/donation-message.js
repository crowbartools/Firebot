// Migration: done

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamlabs:donation", "streamlabs:eldonation", "tipeeestream:donation"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "donationMessage",
        description: "The message from a StreamLabs/Tipeee/ExtraLife donation",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const donationMessage = (trigger.metadata.eventData && trigger.metadata.eventData.donationMessage) || "";

        return donationMessage;
    }
};

module.exports = model;

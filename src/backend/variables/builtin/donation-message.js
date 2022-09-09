// Migration: done

"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "streamlabs:donation",
    "streamlabs:eldonation",
    "tipeeestream:donation",
    "streamelements:donation",
    "extralife:donation"
];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "donationMessage",
        description: "The message from a StreamLabs/Tipeee/StreamElements/ExtraLife donation",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const donationMessage = (trigger.metadata.eventData && trigger.metadata.eventData.donationMessage) || "";

        return donationMessage;
    }
};

module.exports = model;

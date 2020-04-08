"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:ad-break"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "maxAdBreakLength",
        description: "The maximum length (in seconds) the ad-break will run for.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata && trigger.metadata.eventData && trigger.metadata.eventData.maxAdBreakLengthInSec ? trigger.metadata.eventData.maxAdBreakLengthInSec : 0;
    }
};

module.exports = model;

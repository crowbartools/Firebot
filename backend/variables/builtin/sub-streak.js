"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:resub"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "subCurrentStreak",
        description: "Number of consecutive months a user has been subscribed to your channel.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.currentStreak && trigger.metadata.eventData.currentStreak > -1 ? trigger.metadata.eventData.currentStreak : "Unknown Streak";
    }
};

module.exports = model;

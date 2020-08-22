"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:channel-reward-redemption"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "rewardImageUrl",
        description: "The image url of the award",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.rewardImage;
    }
};

module.exports = model;

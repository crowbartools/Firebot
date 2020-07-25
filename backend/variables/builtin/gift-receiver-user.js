"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:subs-gifted"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "giftReceiverUsername",
        description: "The name of the user who just received a gifted sub.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const gifteeUsername = trigger.metadata.eventData.gifteeUsername;

        return gifteeUsername || "UnknownUser";
    }
};

module.exports = model;

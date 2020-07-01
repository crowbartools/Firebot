// Migration: todo - Need twitch sub-gift event trigger

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:subscription-gifted"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "giftReceiverUsername",
        description: "The name of the user who just received a gifted sub.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let receiverUsername = trigger.metadata.eventData.giftReceiverUser;

        return receiverUsername || "UnknownUser";
    }
};

module.exports = model;

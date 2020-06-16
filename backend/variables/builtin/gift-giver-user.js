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
        handle: "giftGiverUsername",
        description: "The name of the user who gifted a sub to someone.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let receiverUsername = trigger.metadata.eventData.gifterUser;
        return receiverUsername || "UnknownUser";
    }
};

module.exports = model;

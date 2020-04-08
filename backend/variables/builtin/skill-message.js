"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:skill"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "skillMessage",
        description: "Any message text associated with a skill (such as Ember Stickers)",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let skillData = trigger.metadata.eventData.data;

        return skillData.skillMessage ? skillData.skillMessage : "";
    }
};

module.exports = model;

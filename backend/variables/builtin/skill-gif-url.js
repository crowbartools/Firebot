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
        handle: "skillGifUrl",
        description: "The url to the GIF Skill used.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let skill = trigger.metadata.eventData.data && trigger.metadata.eventData.data.skill;

        if (!skill || !skill.isGif) {
            return "[Skill Not Gif]";
        }
        return skill.gifUrl;
    }
};

module.exports = model;

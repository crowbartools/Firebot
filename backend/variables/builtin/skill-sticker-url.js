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
        handle: "skillStickerUrl",
        description: "The url to the image of the Sticker used.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let skill = trigger.metadata.eventData.data && trigger.metadata.eventData.data.skill;

        if (!skill) {
            return "[No Skill Available]";
        }

        return skill.icon_url + (skill.isSticker ? "?width=256&height=256" : "");
    }
};

module.exports = model;

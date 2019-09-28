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
        handle: "skillCurrecyType",
        description: "The type of currency used for the Skill (Sparks or Embers).",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let skill = trigger.metadata.eventData.data && trigger.metadata.eventData.data.skill;

        if (!skill) {
            return "[Skill Not Available]";
        }

        return skill.currency;
    }
};

module.exports = model;

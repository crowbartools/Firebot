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
        handle: "skillName",
        description: "The name of the Skill used.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let skill = trigger.metadata.eventData.data && trigger.metadata.eventData.data.skill;

        if (!skill) {
            return "[No Skill Available]";
        }

        return skill.skill_name;
    }
};

module.exports = model;

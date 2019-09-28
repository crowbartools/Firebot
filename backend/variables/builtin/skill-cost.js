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
        handle: "skillCost",
        description: "The cost of the Skill used.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        let skill = trigger.metadata.eventData.data && trigger.metadata.eventData.data.skill;

        if (!skill) {
            return 0;
        }

        return skill.cost;
    }
};

module.exports = model;

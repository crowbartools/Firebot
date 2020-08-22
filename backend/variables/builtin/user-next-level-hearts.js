// Migration: todo - Need implementation details

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:progression-levelup"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "userNextLevelHearts",
        description: "The required hearts a viewer needs to attain their next level.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.userNextLevelXp || 1;
    }
};

module.exports = model;

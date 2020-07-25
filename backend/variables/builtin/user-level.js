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
        handle: "userLevel",
        description: "The channel progression level (rank) of a viewer.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.userLevel || 1;
    }
};

module.exports = model;

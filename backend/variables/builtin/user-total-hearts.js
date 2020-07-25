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
        handle: "userTotalHearts",
        description: "The total hearts (xp) a viewer has towards channel progression.",
        hidden: true,
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.userTotalHearts || 1;
    }
};

module.exports = model;

"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:subscribed", "mixer:resub"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "subMonths",
        description: "The total number of months the user has been subscribed since the beginning of time.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.totalMonths;
    }
};

module.exports = model;

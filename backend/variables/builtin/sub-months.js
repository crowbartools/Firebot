"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:subscribed", "mixer:resub"];
triggers[EffectTrigger.MANUAL] = true;
/**
 * The $subMonths variable
 */
const subMonthsVariable = {
    definition: {
        handle: "subMonths",
        description: "The number of months a viewer has been subscribed for.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.totalMonths;
    }
};

module.exports = subMonthsVariable;

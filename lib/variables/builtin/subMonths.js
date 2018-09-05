"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:subscribed", "mixer:resub"];
triggers[EffectTrigger.MANUAL] = true;
/**
 * The $subMonths variable
 */
const subMonthsVariable = {
    definition: {
        handle: "subMonths",
        triggers: triggers
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.totalMonths;
    }
};

module.exports = subMonthsVariable;

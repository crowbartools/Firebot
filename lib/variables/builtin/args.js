"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");


/**
 * The $subMonths variable
 */
const commmandArg = {
    definition: {
        handle: "subMonths",
        triggers: [EffectTrigger.EVENT],
        triggerRequirements: {
            events: ["mixer:subscribed", "mixer:resub"]
        }
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.totalMonths;
    }
};

module.exports = subMonthsVariable;

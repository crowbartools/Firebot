"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");



let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = true;
triggers[EffectTrigger.INTERACTIVE] = true;
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.CUSTOM_SCRIPT] = true;

/**
 * The $user variable
 */
const userVariable = {
    definition: {
        handle: "user",
        triggers: triggers
    },
    evaluator: (trigger) => {
        return trigger.metadata.username;
    }
};

module.exports = userVariable;

"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");


/**
 * The $user variable
 */
const userVariable = {
    definition: {
        handle: "user",
        triggers: [EffectTrigger.COMMAND,
            EffectTrigger.EVENT,
            EffectTrigger.INTERACTIVE,
            EffectTrigger.MANUAL,
            EffectTrigger.CUSTOM_SCRIPT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.username;
    }
};

module.exports = userVariable;

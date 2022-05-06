"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType } = require("../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = true;
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.CUSTOM_SCRIPT] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.CHANNEL_REWARD] = true;
triggers[EffectTrigger.QUICK_ACTION] = true;


module.exports = {
    definition: {
        handle: "username",
        description: "The associated user (if there is one) for the given trigger. Alternative to $user",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.username;
    }
};


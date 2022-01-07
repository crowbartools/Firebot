// Migration: done

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "commandTrigger",
        description: "The trigger of the issued command.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.userCommand.trigger;
    }
};

module.exports = model;

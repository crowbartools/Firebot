// Migration: info needed

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "argArray",
        description: "Returns a JSON array of command arguments",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return JSON.stringify(trigger.metadata.userCommand ? trigger.metadata.userCommand.args : []);
    }
};

module.exports = model;

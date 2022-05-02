// Migration: info needed

"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.QUICK_ACTION] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "presetListArg",
        usage: "presetListArg[name]",
        description: "Represents the given argument passed to this preset effect list.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (trigger, argName = "") => {
        const args = trigger.metadata.presetListArgs || {};
        return args[argName] || null;
    }
};

module.exports = model;

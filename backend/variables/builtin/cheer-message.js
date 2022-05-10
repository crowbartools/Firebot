"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:cheer"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "cheerMessage",
        description: "The message included with the cheer",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const cheerMessage = trigger.metadata.eventData.cheerMessage || "";
        return cheerMessage
            .replace(/( |\b)[a-zA-Z]+\d+( |\b)/g, "")
            .trim();
    }
};

module.exports = model;

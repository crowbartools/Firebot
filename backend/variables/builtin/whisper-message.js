"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:whisper"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "whisperMessage",
        description: "The message included with the whisper.",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const whisperMessage = trigger.metadata.eventData.message || "";
        return whisperMessage;
    }
};

module.exports = model;

"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:banned", "twitch:unbanned", "twitch:timeout", "twitch:chat-mode-changed", "twitch:shoutout-sent"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "moderator",
        description: "The name of the moderator that performed the action (ban, unban, timeout, chat mode change, or shoutout).",
        triggers: triggers,
        categories: [VariableCategory.USER, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.text]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.moderator;
    }
};

module.exports = model;

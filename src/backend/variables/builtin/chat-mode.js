"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:chat-mode-changed"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "chatMode",
        description: "The mode to which the chat has been updated.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.text]
    },
    evaluator: (trigger) => {
        switch (trigger.metadata.eventData.chatMode) {
            case "emoteonly":
            case "emoteonlyoff":
                return "Emote Only";
            case "followers":
            case "followersoff":
                return "Followers";
            case "subscribers":
            case "subscribersoff":
                return "Subscribers Only";
            case "slow":
            case "slowoff":
                return "Slow";
            case "r9kbeta":
            case "r9kbetaoff":
                return "Unique Chat";
            default:
                return "";
        }
    }
};

module.exports = model;

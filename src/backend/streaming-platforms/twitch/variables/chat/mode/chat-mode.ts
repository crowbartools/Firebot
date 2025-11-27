import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:chat-mode-changed"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "chatMode",
        description: "The mode to which the chat has been updated.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["text"]
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
            case "uniquechat":
            case "uniquechatoff":
                return "Unique Chat";
            default:
                return "";
        }
    }
};

export default model;

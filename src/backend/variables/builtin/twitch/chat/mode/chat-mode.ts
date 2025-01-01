import { ReplaceVariable } from "../../../../../../types/variables";
import { EffectTrigger } from "../../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:chat-mode-changed"];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "chatMode",
        description: "The mode to which the chat has been updated.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
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

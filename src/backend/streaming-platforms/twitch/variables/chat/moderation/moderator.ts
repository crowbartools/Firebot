import { ReplaceVariable } from "../../../../../../types/variables";
import { EffectTrigger } from "../../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../../shared/variable-constants";


const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:banned", "twitch:unbanned", "twitch:timeout", "twitch:chat-mode-changed", "twitch:shoutout-sent", "twitch:outgoing-raid-canceled", "twitch:outgoing-raid-started"];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "moderator",
        description: "The name of the moderator that performed the action (ban, unban, timeout, chat mode change, shoutout, or raid create/cancel).",
        triggers: triggers,
        categories: [VariableCategory.USER, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.moderator;
    }
};

export default model;

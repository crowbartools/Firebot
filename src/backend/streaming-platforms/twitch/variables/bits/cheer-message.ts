import { ReplaceVariable, Trigger } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../../shared/effect-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:cheer", "twitch:bits-powerup-message-effect", "twitch:bits-powerup-gigantified-emote"];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "cheerMessage",
        description: "The message included with the cheer",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger: Trigger) => {
        const cheerMessage = <string>(trigger.metadata.eventData.cheerMessage || "");
        return cheerMessage
            .replace(/[a-zA-Z]+\d+( |\b)/g, "")
            .trim();
    }
};

export default model;

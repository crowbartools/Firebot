import { ReplaceVariable, Trigger } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../../shared/effect-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:cheer", "twitch:bits-powerup-message-effect", "twitch:bits-powerup-celebration", "twitch:bits-powerup-gigantified-emote"];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "cheerTotalBits",
        description: "The total amount of bits cheered by a viewer in the channel.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger: Trigger) => {
        return trigger.metadata.eventData.totalBits || 0;
    }
};

export default model;

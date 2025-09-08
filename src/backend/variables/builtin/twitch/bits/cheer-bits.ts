import { ReplaceVariable, Trigger } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const { EffectTrigger } = require("../../../../../shared/effect-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:cheer", "twitch:bits-powerup-message-effect", "twitch:bits-powerup-celebration", "twitch:bits-powerup-gigantified-emote"];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "cheerBitsAmount",
        description: "The amount of bits in the cheer.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger: Trigger) => {
        const bits = trigger.metadata.eventData.bits || 0;
        return bits;
    }
};

export default model;

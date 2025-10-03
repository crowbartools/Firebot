import { ReplaceVariable, Trigger } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../../shared/effect-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:bits-powerup-gigantified-emote"];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "gigantifiedEmoteName",
        description: "The name of the gigantified emote.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger: Trigger) => trigger.metadata.eventData.emoteName
};

export default model;

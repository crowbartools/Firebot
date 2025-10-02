import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:hype-train-level-up"];
triggers[EffectTrigger.MANUAL] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "hypeTrainPreviousLevel",
        description: "The previous level of the current Twitch Hype Train.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.previous;
    }
};

export default model;
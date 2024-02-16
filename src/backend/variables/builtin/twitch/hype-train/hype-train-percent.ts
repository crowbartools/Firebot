import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:hype-train-start", "twitch:hype-train-progress"];
triggers[EffectTrigger.MANUAL] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "hypeTrainPercent",
        description: "The percent completion of the current level of the Twitch Hype Train.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        const progress = trigger.metadata.eventData.progress as number;
        const goal = trigger.metadata.eventData.goal as number;
        return Math.floor((progress / goal) * 100);
    }
};

export default model;
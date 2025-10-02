import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:ad-break-upcoming",
    "twitch:ad-break-start",
    "twitch:ad-break-end"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "adBreakDuration",
        description: "The duration of the triggered ad break, in seconds",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        const adBreakDuration = trigger.metadata?.eventData?.adBreakDuration ?? 0;

        return adBreakDuration;
    }
};

export default model;
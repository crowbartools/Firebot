import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:ad-break-start",
    "twitch:ad-break-end"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "isAdBreakScheduled",
        description: "Whether or not the triggered ad break was scheduled",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.BOOLEAN]
    },
    evaluator: (trigger) => {
        const isAdBreakScheduled = trigger.metadata?.eventData?.isAdBreakScheduled ?? false;

        return isAdBreakScheduled;
    }
};

export default model;
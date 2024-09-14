import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../../shared/effect-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:raid-sent-off"];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "raidTargetUserDisplayName",
        description: "Gets the formatted display name for the raid target",
        triggers: triggers,
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger) => {
        return trigger.metadata.eventData?.raidTargetUserDisplayName ?? "";
    }
};

export default model;

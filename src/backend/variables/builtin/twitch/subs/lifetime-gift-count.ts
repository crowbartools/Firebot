import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:subs-gifted",
    "twitch:community-subs-gifted"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "lifetimeGiftCount",
        description: "The total number of subs the user has gifted over the lifetime of the channel.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.lifetimeGiftCount || 0;
    }
};

export default model;

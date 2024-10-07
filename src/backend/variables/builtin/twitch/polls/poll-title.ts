import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:channel-poll-begin",
    "twitch:channel-poll-progress",
    "twitch:channel-poll-end"
];
triggers[EffectTrigger.MANUAL] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "pollTitle",
        description: 'The title of the Twitch poll that triggered the event, or "Unknown" if no poll information is available',
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.title ?? "Unknown";
    }
};

export default model;

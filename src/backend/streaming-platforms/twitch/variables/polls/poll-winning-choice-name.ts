import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:channel-poll-progress",
    "twitch:channel-poll-end"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "pollWinningChoiceName",
        description: "The name of the winning Twitch poll choice. If there is more than one, this will return a comma separated list (e.g. \"Option 1, Option 2, Option 3\")",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.winningChoiceName ?? "Unknown";
    }
};

export default model;

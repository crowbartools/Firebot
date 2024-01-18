import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../../shared/effect-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:channel-goal-begin",
    "twitch:channel-goal-progress",
    "twitch:channel-goal-end"
];
triggers[EffectTrigger.MANUAL] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "channelGoalType",
        description: "The type of channel goal that triggered the event.",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        return trigger.metadata?.eventData?.friendlyType ?? "No active goal";
    }
};

export default model;
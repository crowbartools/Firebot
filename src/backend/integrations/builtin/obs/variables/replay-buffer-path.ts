import { TriggerType } from "../../../../common/EffectType";
import { ReplaceVariable } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_REPLAY_BUFFER_SAVED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_REPLAY_BUFFER_SAVED_EVENT_ID}`
];

export const ReplayBufferPathVariable: ReplaceVariable = {
    definition: {
        handle: "obsReplayBufferPath",
        description:
      "The path of the replay buffer file that OBS saved.",
        possibleDataOutput: ["text"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const replayBufferPath = trigger.metadata?.eventData?.savedReplayPath;
        return replayBufferPath ?? "Unknown";
    }
};

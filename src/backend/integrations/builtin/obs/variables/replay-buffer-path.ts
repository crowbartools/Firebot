import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_REPLAY_BUFFER_SAVED_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_REPLAY_BUFFER_SAVED_EVENT_ID}`
];

export const ReplayBufferPathVariable: ReplaceVariable = {
    definition: {
        handle: "obsReplayBufferPath",
        description:
      "The path of the replay buffer file that OBS saved.",
        possibleDataOutput: ["text"],
        categories: ["advanced", "integrations", "obs"],
        triggers: triggers
    },
    evaluator: (trigger) => {
        const replayBufferPath = trigger.metadata?.eventData?.savedReplayPath;
        return replayBufferPath ?? "Unknown";
    }
};
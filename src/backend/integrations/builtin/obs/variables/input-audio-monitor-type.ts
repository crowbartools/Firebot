import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_AUDIO_MONITOR_TYPE_CHANGED_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_MONITOR_TYPE_CHANGED_EVENT_ID}`
];
triggers["manual"] = true;

export const InputAudioMonitorTypeVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputMonitorType",
        description: "Returns the audio monitor type of the OBS input. Values are `None`, `Monitor Only`, or `Monitor and Output`.",
        possibleDataOutput: ["text"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: (trigger) => {
        const monitorType = trigger.metadata?.eventData?.monitorType;

        switch (monitorType) {
            case "OBS_MONITORING_TYPE_MONITOR_ONLY":
                return "Monitor Only";

            case "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT":
                return "Monitor and Output";

            case "OBS_MONITORING_TYPE_NONE":
            default:
                return "None";
        }
    }
};
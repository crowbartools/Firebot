import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_AUDIO_MONITOR_TYPE_CHANGED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_MONITOR_TYPE_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputAudioMonitorTypeVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputMonitorType",
        description: "Returns the audio monitor type of the OBS input. Values are `None`, `Monitor Only`, or `Monitor and Output`.",
        possibleDataOutput: ["text"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async (trigger) => {
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

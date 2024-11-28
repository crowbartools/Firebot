import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputAudioSyncOffsetVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputAudioSyncOffset",
        description: "Returns the audio sync offset (in milliseconds) of the OBS input.",
        possibleDataOutput: ["number"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async (trigger) => {
        const inputAudioSyncOffset = trigger.metadata?.eventData?.inputAudioSyncOffset;
        return inputAudioSyncOffset ?? 0;
    }
};

import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";
const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputAudioTracksVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputAudioTracks",
        description: "Returns the raw OBS audio tracks object of the OBS input.",
        possibleDataOutput: ["object"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async (trigger) => {
        const inputAudioTracks = trigger.metadata?.eventData?.inputAudioTracks;
        return inputAudioTracks ?? {};
    }
};

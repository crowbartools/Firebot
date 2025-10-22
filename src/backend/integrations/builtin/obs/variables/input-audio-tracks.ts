import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID}`
];
triggers["manual"] = true;

export const InputAudioTracksVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputAudioTracks",
        description: "Returns the raw OBS audio tracks object of the OBS input.",
        possibleDataOutput: ["object"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: (trigger) => {
        const inputAudioTracks = trigger.metadata?.eventData?.inputAudioTracks;
        return inputAudioTracks ?? {};
    }
};
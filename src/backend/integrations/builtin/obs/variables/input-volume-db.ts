import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_VOLUME_CHANGED_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_VOLUME_CHANGED_EVENT_ID}`
];
triggers["manual"] = true;

export const InputVolumeDbVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputVolumeDb",
        description: "Returns the volume level in dB of the OBS input.",
        possibleDataOutput: ["number"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: (trigger) => {
        const inputVolumeDb = trigger.metadata?.eventData?.inputVolumeDb;
        return inputVolumeDb ?? 0;
    }
};
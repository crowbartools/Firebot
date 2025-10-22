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

export const InputVolumeMultiplierVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputVolumeMultiplier",
        description: "Returns the volume level multiplier of the OBS input.",
        possibleDataOutput: ["number"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: (trigger) => {
        const inputVolumeMultiplier = trigger.metadata?.eventData?.inputVolumeMultiplier;
        return inputVolumeMultiplier ?? 0;
    }
};
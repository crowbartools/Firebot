import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_NAME_CHANGED_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_NAME_CHANGED_EVENT_ID}`
];
triggers["manual"] = true;

export const OldInputNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsOldInputName",
        description: "Returns the previous name of the OBS input.",
        categories: ["advanced", "integrations", "obs"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const oldInputName = trigger.metadata?.eventData?.oldInputName;
        return oldInputName ?? "Unknown";
    }
};
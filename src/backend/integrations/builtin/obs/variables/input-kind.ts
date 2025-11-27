import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_CREATED_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_CREATED_EVENT_ID}`
];
triggers["manual"] = true;

export const InputKindVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputKind",
        description: "Returns the OBS internal name of the kind of OBS input.",
        possibleDataOutput: ["text"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: (trigger) => {
        const inputKind = trigger.metadata?.eventData?.inputKind;
        return inputKind ?? "Unknown";
    }
};
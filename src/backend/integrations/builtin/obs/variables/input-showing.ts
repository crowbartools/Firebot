import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_SHOW_STATE_CHANGED_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_SHOW_STATE_CHANGED_EVENT_ID}`
];
triggers["manual"] = true;

export const InputShowingVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputShowing",
        description: "Returns `true` if the OBS input is currently showing or `false` if it is not.",
        possibleDataOutput: ["bool"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: (trigger) => {
        const inputShowing = trigger.metadata?.eventData?.inputShowing;
        return inputShowing ?? false;
    }
};
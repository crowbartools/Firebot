import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_CURRENT_SCENE_TRANSITION_CHANGED_EVENT_ID,
    OBS_EVENT_SOURCE_ID,
    OBS_SCENE_TRANSITION_ENDED_EVENT_ID,
    OBS_SCENE_TRANSITION_STARTED_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_SCENE_TRANSITION_STARTED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_SCENE_TRANSITION_ENDED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_CURRENT_SCENE_TRANSITION_CHANGED_EVENT_ID}`
];

export const TransitionNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsTransitionName",
        description:
      "The name of the OBS transition that triggered the event.",
        possibleDataOutput: ["text"],
        categories: ["advanced", "integrations", "obs"],
        triggers: triggers
    },
    evaluator: (trigger) => {
        const transitionName = trigger.metadata?.eventData?.transitionName;
        return transitionName ?? "Unknown";
    }
};
import { TriggerType } from "../../../../common/EffectType";
import { ReplaceVariable } from "../../../../../types/variables";
import {
    OBS_CURRENT_SCENE_TRANSITION_CHANGED_EVENT_ID,
    OBS_EVENT_SOURCE_ID,
    OBS_SCENE_TRANSITION_ENDED_EVENT_ID,
    OBS_SCENE_TRANSITION_STARTED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
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
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const transitionName = trigger.metadata?.eventData?.transitionName;
        return transitionName ?? "Unknown";
    }
};

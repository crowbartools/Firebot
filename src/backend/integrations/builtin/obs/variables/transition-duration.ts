import { TriggerType } from "../../../../common/EffectType";
import { ReplaceVariable } from "../../../../../types/variables";
import {
    OBS_CURRENT_SCENE_TRANSITION_DURATION_CHANGED_EVENT_ID,
    OBS_EVENT_SOURCE_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_CURRENT_SCENE_TRANSITION_DURATION_CHANGED_EVENT_ID}`
];

export const TransitionDurationVariable: ReplaceVariable = {
    definition: {
        handle: "obsTransitionDuration",
        description:
      "The new duration (in milliseconds) of the OBS transition that was updated.",
        possibleDataOutput: ["number"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const transitionDuration = trigger.metadata?.eventData?.transitionDuration;
        return transitionDuration ?? 0;
    }
};

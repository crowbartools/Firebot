import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_SHOW_STATE_CHANGED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_SHOW_STATE_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputShowingVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputShowing",
        description: "Returns `true` if the OBS input is currently showing or `false` if it is not.",
        possibleDataOutput: ["bool"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async (trigger) => {
        const inputShowing = trigger.metadata?.eventData?.inputShowing;
        return inputShowing ?? false;
    }
};

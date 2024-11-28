import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_MUTE_STATE_CHANGED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";
const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_MUTE_STATE_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputMutedVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputMuted",
        description: "Returns `true` if the OBS input is muted or `false` if it is not.",
        possibleDataOutput: ["bool"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async (trigger) => {
        const inputMuted = trigger.metadata?.eventData?.inputMuted;
        return inputMuted ?? false;
    }
};

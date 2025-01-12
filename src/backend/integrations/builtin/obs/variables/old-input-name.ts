import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_NAME_CHANGED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_NAME_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const OldInputNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsOldInputName",
        description: "Returns the previous name of the OBS input.",
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger) => {
        const oldInputName = trigger.metadata?.eventData?.oldInputName;
        return oldInputName ?? "Unknown";
    }
};

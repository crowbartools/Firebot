import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_CREATED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_CREATED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputKindVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputKind",
        description: "Returns the OBS internal name of the kind of OBS input.",
        possibleDataOutput: ["text"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async (trigger) => {
        const inputKind = trigger.metadata?.eventData?.inputKind;
        return inputKind ?? "Unknown";
    }
};

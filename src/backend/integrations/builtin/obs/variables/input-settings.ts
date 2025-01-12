import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_CREATED_EVENT_ID,
    OBS_INPUT_SETTINGS_CHANGED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_CREATED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_SETTINGS_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputSettingsVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputSettings",
        description: "Returns the raw OBS settings object of the OBS input.",
        possibleDataOutput: ["object"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async (trigger) => {
        const inputSettings = trigger.metadata?.eventData?.inputSettings;
        return inputSettings ?? {};
    }
};

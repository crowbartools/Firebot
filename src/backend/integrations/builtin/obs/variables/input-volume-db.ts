import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_VOLUME_CHANGED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_VOLUME_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputVolumeDbVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputVolumeDb",
        description: "Returns the volume level in dB of the OBS input.",
        possibleDataOutput: ["number"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async (trigger) => {
        const inputVolumeDb = trigger.metadata?.eventData?.inputVolumeDb;
        return inputVolumeDb ?? 0;
    }
};

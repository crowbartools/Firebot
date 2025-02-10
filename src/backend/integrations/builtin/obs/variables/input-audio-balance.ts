import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID
} from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";
const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputAudioBalanceVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputAudioBalance",
        description: "Returns the audio balance value of the OBS input.",
        possibleDataOutput: ["number"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async (trigger) => {
        const inputAudioBalance = trigger.metadata?.eventData?.inputAudioBalance;
        return inputAudioBalance ?? 0;
    }
};

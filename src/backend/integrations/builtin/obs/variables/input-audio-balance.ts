import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID}`
];
triggers["manual"] = true;

export const InputAudioBalanceVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputAudioBalance",
        description: "Returns the audio balance value of the OBS input.",
        possibleDataOutput: ["number"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: (trigger) => {
        const inputAudioBalance = trigger.metadata?.eventData?.inputAudioBalance;
        return inputAudioBalance ?? 0;
    }
};
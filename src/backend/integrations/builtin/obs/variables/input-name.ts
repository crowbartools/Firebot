import { ReplaceVariable } from "../../../../../types/variables";
import { TriggerType } from "../../../../common/EffectType";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_INPUT_CREATED_EVENT_ID,
    OBS_INPUT_REMOVED_EVENT_ID,
    OBS_INPUT_NAME_CHANGED_EVENT_ID,
    OBS_INPUT_SETTINGS_CHANGED_EVENT_ID,
    OBS_INPUT_ACTIVE_STATE_CHANGED_EVENT_ID,
    OBS_INPUT_SHOW_STATE_CHANGED_EVENT_ID,
    OBS_INPUT_MUTE_STATE_CHANGED_EVENT_ID,
    OBS_INPUT_VOLUME_CHANGED_EVENT_ID,
    OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID,
    OBS_INPUT_AUDIO_SYNC_OFFSET_CHANGED_EVENT_ID,
    OBS_INPUT_AUDIO_MONITOR_TYPE_CHANGED_EVENT_ID,
    OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID
} from "../constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_CREATED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_REMOVED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_NAME_CHANGED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_SETTINGS_CHANGED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_ACTIVE_STATE_CHANGED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_SHOW_STATE_CHANGED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_MUTE_STATE_CHANGED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_VOLUME_CHANGED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_SYNC_OFFSET_CHANGED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_MONITOR_TYPE_CHANGED_EVENT_ID}`,
    `${OBS_EVENT_SOURCE_ID}:${OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const InputNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsInputName",
        description: "Returns the name of the OBS input.",
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger) => {
        const inputName = trigger.metadata?.eventData?.inputName;
        return inputName ?? "Unknown";
    }
};

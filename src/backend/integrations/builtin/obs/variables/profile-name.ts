import { TriggerType } from "../../../../common/EffectType";
import { ReplaceVariable } from "../../../../../types/variables";
import {
    OBS_CURRENT_PROFILE_CHANGED_EVENT_ID,
    OBS_EVENT_SOURCE_ID
} from "../constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_CURRENT_PROFILE_CHANGED_EVENT_ID}`
];

export const ProfileNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsProfileName",
        description:
      "The name of the OBS profile that triggered the event.",
        possibleDataOutput: ["text"],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const profileName = trigger.metadata?.eventData?.profileName;
        return profileName ?? "Unknown";
    }
};

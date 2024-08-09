import { TriggerType } from "../../../../common/EffectType";
import { ReplaceVariable } from "../../../../../types/variables";
import { OBS_EVENT_SOURCE_ID, OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID } from "../constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const GroupNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsGroupName",
        description:
            "The name of the OBS group containing the item that triggered the event, or 'Unknown' if the element isn't grouped.",
        possibleDataOutput: ["text"],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const groupName = trigger.metadata?.eventData?.groupName;
        return groupName ?? "Unknown";
    }
};

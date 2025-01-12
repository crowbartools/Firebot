import { TriggerType } from "../../../../common/EffectType";
import { ReplaceVariable } from "../../../../../types/variables";
import { OBS_EVENT_SOURCE_ID, OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID } from "../constants";
import { VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID}`
];
triggers[TriggerType.MANUAL] = true;

export const GroupItemIdVariable: ReplaceVariable = {
    definition: {
        handle: "obsGroupItemId",
        description:
            "The group-unique numeric ID of the item in OBS that triggered the event, or -1 when the item is not grouped.",
        possibleDataOutput: ["number"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const groupItemId = trigger.metadata?.eventData?.groupItemId;
        return groupItemId ?? -1;
    }
};

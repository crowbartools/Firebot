import { TriggerType } from "../../../../common/EffectType";
import { ReplaceVariable } from "../../../../../types/variables";
import { OBS_EVENT_SOURCE_ID, OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID } from "../constants";
import { getSceneItem } from "../obs-remote";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID}`
];

export const SceneItemNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsSceneItemName",
        description:
      "The name of the OBS scene item that triggered the event.",
        possibleDataOutput: ["text"],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const sceneItem = await getSceneItem(
            trigger.metadata?.eventData?.sceneName as string,
            trigger.metadata?.eventData?.sceneItemId as number
        );
        return sceneItem?.name ?? "Unknown";
    }
};

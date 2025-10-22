import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import { OBS_EVENT_SOURCE_ID, OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID } from "../constants";
import { getGroupItem, getSceneItem } from "../obs-remote";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID}`
];
triggers["manual"] = true;

export const SceneItemNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsSceneItemName",
        description:
      "The name of the OBS scene item that triggered the event.",
        possibleDataOutput: ["text"],
        categories: ["advanced", "integrations", "obs"],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        if (typeof trigger.metadata?.eventData?.groupItemId === "number" && typeof trigger.metadata?.eventData?.groupName === "string") {
            return (await getGroupItem(
                trigger.metadata.eventData.groupName,
                trigger.metadata.eventData.groupItemId
            ))?.name ?? "Unknown";
        }
        const sceneItem = await getSceneItem(
            trigger.metadata?.eventData?.sceneName as string,
            trigger.metadata?.eventData?.sceneItemId as number
        );
        return sceneItem?.name ?? "Unknown";
    }
};
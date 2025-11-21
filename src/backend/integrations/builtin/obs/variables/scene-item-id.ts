import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import { OBS_EVENT_SOURCE_ID, OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID } from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID}`
];

export const SceneItemIdVariable: ReplaceVariable = {
    definition: {
        handle: "obsSceneItemId",
        description:
      "The numeric ID of the OBS scene item that triggered the event.",
        possibleDataOutput: ["number"],
        categories: ["advanced", "integrations", "obs"],
        triggers: triggers
    },
    evaluator: (trigger) => {
        const sceneItemId = trigger.metadata?.eventData?.sceneItemId;
        return sceneItemId ?? -1;
    }
};
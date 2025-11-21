import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import { OBS_EVENT_SOURCE_ID, OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID } from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID}`
];

export const SceneItemEnabledVariable: ReplaceVariable = {
    definition: {
        handle: "obsSceneItemEnabled",
        description:
      "Returns `true` if the OBS scene item that triggered the event is enabled, or `false` otherwise.",
        possibleDataOutput: ["bool"],
        categories: ["advanced", "integrations", "obs"],
        triggers: triggers
    },
    evaluator: (trigger) => {
        const sceneItemEnabled = trigger.metadata?.eventData?.sceneItemEnabled;
        return sceneItemEnabled ?? false;
    }
};
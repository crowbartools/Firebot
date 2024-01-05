import { ReplaceVariable } from "../../../../../types/variables";
import { getCurrentSceneCollectionName } from "../obs-remote";

export const SceneCollectionNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsSceneCollectionName",
        description:
      "The name of the OBS scene collection that triggered the event, or the name of the current OBS scene collection if there is no event. If OBS isn't running, it returns 'Unknown'.",
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger) => {
        const currentSceneCollectionName = trigger.metadata?.eventData?.sceneCollectionName ?? await getCurrentSceneCollectionName();
        return currentSceneCollectionName ?? "Unknown";
    }
};

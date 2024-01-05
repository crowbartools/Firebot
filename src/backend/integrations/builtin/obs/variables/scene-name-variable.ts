import { ReplaceVariable } from "../../../../../types/variables";
import { getCurrentSceneName } from "../obs-remote";

export const SceneNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsSceneName",
        description:
      "The name of the OBS scene that triggered the event, or the current OBS Scene if there is no event. If OBS isn't running, it returns 'Unknown'.",
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger) => {
        const currentSceneName = trigger.metadata?.eventData?.sceneName ?? await getCurrentSceneName();
        return currentSceneName ?? "Unknown";
    }
};

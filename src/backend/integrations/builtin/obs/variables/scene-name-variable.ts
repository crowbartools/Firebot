import { ReplaceVariable } from "../../../../../types/variables";
import { getCurrentSceneName } from "../obs-remote";
import { VariableCategory } from "../../../../../shared/variable-constants";

export const SceneNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsSceneName",
        description:
      "The name of the OBS scene that triggered the event, or the current OBS Scene if there is no event. If OBS isn't running, it returns 'Unknown'.",
        possibleDataOutput: ["text"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: (trigger) => {
        const currentSceneName = trigger.metadata?.eventData?.sceneName ?? getCurrentSceneName();
        return currentSceneName ?? "Unknown";
    }
};

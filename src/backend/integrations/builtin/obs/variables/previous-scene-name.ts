import { ReplaceVariable } from "../../../../../types/variables";
import { getPreviousSceneName } from "../obs-remote";

export const PreviousSceneNameVariable: ReplaceVariable = {
    definition: {
        handle: "obsPreviousSceneName",
        description:
      "The name of the previous OBS scene. If OBS isn't running, it returns 'Unknown'.",
        possibleDataOutput: ["text"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: () => {
        return getPreviousSceneName() ?? "Unknown";
    }
};

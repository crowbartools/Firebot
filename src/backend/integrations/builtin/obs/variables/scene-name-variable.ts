import { ReplaceVariable } from "../../../../../types/variables";
import { getCurrentSceneName } from "../obs-remote";

export const SceneNameVariable: ReplaceVariable = {
  definition: {
    handle: "obsSceneName",
    description:
      "The name of the current OBS Scene. If OBS isn't running, it returns 'Unknown'.",
    possibleDataOutput: ["text"],
  },
  evaluator: async () => {
    const currentSceneName = await getCurrentSceneName();
    return currentSceneName ?? "Unknown";
  },
};

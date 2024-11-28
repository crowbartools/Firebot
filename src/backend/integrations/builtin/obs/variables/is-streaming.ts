import { ReplaceVariable } from "../../../../../types/variables";
import { isStreaming } from "../obs-remote";
import { VariableCategory } from "../../../../../shared/variable-constants";

export const IsStreamingVariable: ReplaceVariable = {
    definition: {
        handle: "obsIsStreaming",
        description:
      "Returns 'true' if OBS is currently streaming or 'false' if it is not.",
        possibleDataOutput: ["bool"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async () => {
        const streamState = await isStreaming();
        return streamState ?? false;
    }
};

import { ReplaceVariable } from "../../../../../types/variables";
import { isStreaming } from "../obs-remote";

export const IsStreamingVariable: ReplaceVariable = {
    definition: {
        handle: "obsIsStreaming",
        description:
      "Returns 'true' if OBS is currently streaming or 'false' if it is not.",
        possibleDataOutput: ["bool"]
    },
    evaluator: async () => {
        const streamState = await isStreaming();
        return streamState ?? false;
    }
};

import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { isStreaming } from "../obs-remote";

export const IsStreamingVariable: ReplaceVariable = {
  definition: {
    handle: "obsIsStreaming",
    description:
      "Returns 'true' if OBS is currently streaming or 'false' if it is not.",
    possibleDataOutput: ["text"],
  },
  evaluator: async () => {
    const streamState = await isStreaming();
    return streamState ?? false;
  },
};

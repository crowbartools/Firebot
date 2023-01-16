import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { isStreamRunning } from "../obs-remote";

export const StreamIsRunningVariable: ReplaceVariable = {
  definition: {
    handle: "obsStreamIsRunning",
    description:
      "Returns 'true' if OBS is currently streaming or 'false' if it is not.",
    possibleDataOutput: ["text"],
  },
  evaluator: async () => {
    const streamState = await isStreamRunning();
    return streamState ?? false;
  },
};

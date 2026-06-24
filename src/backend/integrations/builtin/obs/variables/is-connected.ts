import type { ReplaceVariable } from "../../../../../types";
import { isConnected } from "../obs-remote";

export const IsConnectedVariable: ReplaceVariable = {
    definition: {
        handle: "obsIsConnected",
        description: "Returns 'true' if OBS is currently connected or 'false' if it is not.",
        possibleDataOutput: ["bool"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: () => {
        return isConnected() ?? false;
    }
};

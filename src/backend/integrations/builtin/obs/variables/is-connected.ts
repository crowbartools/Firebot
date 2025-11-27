import { ReplaceVariable } from "../../../../../types/variables";
import { isConnected } from "../obs-remote";

export const IsConnectedVariable: ReplaceVariable = {
    definition: {
        handle: "obsIsConnected",
        description: "Returns 'true' if OBS is currently connected or 'false' if it is not.",
        possibleDataOutput: ["bool"],
        categories: ["advanced", "integrations", "obs"]
    },
    evaluator: async () => {
        return isConnected() ?? false;
    }
};

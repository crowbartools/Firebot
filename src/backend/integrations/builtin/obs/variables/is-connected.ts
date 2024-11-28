import { ReplaceVariable } from "../../../../../types/variables";
import { isConnected } from "../obs-remote";
import { VariableCategory } from "../../../../../shared/variable-constants";

export const IsConnectedVariable: ReplaceVariable = {
    definition: {
        handle: "obsIsConnected",
        description: "Returns 'true' if OBS is currently connected or 'false' if it is not.",
        possibleDataOutput: ["bool"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async () => {
        return isConnected() ?? false;
    }
};

import { ReplaceVariable } from "../../../../../types/variables";
import { isRecording } from "../obs-remote";

export const IsConnectedVariable: ReplaceVariable = {
    definition: {
        handle: "obsIsConnected",
        description:
      "Returns 'true' if OBS is currently recording or 'false' if it is not.",
        possibleDataOutput: ["text"]
    },
    evaluator: async () => {
        const recordState = await isRecording();
        return recordState ?? false;
    }
};

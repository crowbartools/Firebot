import { ReplaceVariable } from "../../../../../types/variables";
import { isRecording } from "../obs-remote";
import { VariableCategory } from "../../../../../shared/variable-constants";

export const IsRecordingVariable: ReplaceVariable = {
    definition: {
        handle: "obsIsRecording",
        description:
      "Returns 'true' if OBS is currently recording or 'false' if it is not.",
        possibleDataOutput: ["bool"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS]
    },
    evaluator: async () => {
        const recordState = await isRecording();
        return recordState ?? false;
    }
};

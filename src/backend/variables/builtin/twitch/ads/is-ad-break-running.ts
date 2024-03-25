import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import adManager from "../../../../twitch-api/ad-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "isAdBreakRunning",
        description: "Whether or not an ad break is currently running",
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.BOOLEAN]
    },
    evaluator: () => {
        return adManager.isAdBreakRunning;
    }
};

export default model;
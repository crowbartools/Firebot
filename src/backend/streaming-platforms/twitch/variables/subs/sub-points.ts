import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { TwitchApi } from "../../api";

const model: ReplaceVariable = {
    definition: {
        handle: "subPoints",
        description: "The number of sub points you currently have.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        return await TwitchApi.subscriptions.getSubPointCount();
    }
};

export default model;
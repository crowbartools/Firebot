import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { TwitchApi } from "../../api";

const model: ReplaceVariable = {
    definition: {
        handle: "subCount",
        description: "The number of subs you currently have.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        return await TwitchApi.subscriptions.getSubscriberCount();
    }
};

export default model;
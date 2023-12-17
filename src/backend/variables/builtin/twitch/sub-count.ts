import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import twitchApi from "../../../twitch-api/api";

const model: ReplaceVariable = {
    definition: {
        handle: "subCount",
        description: "The number of subs you currently have.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        return await twitchApi.subscriptions.getSubscriberCount();
    }
};

module.exports = model;
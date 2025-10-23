import type { ReplaceVariable } from "../../../../../types/variables";
import { TwitchApi } from "../../api";

const model: ReplaceVariable = {
    definition: {
        handle: "subCount",
        description: "The number of subs you currently have.",
        categories: ["numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: async () => {
        return await TwitchApi.subscriptions.getSubscriberCount();
    }
};

export default model;
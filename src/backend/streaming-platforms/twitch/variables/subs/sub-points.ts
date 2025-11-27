import type { ReplaceVariable } from "../../../../../types/variables";
import { TwitchApi } from "../../api";

const model: ReplaceVariable = {
    definition: {
        handle: "subPoints",
        description: "The number of sub points you currently have.",
        categories: ["numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: async () => {
        return await TwitchApi.subscriptions.getSubPointCount();
    }
};

export default model;
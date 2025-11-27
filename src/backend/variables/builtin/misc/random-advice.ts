import type { ReplaceVariable } from "../../../../types/variables";
import apiProcessor from "../../../common/handlers/apiProcessor";

const model : ReplaceVariable = {
    definition: {
        handle: "randomAdvice",
        usage: "randomAdvice",
        description: "Get some random advice!",
        possibleDataOutput: ["text"]
    },
    evaluator: async () => {
        return await apiProcessor.getApiResponse("Advice");
    }
};

export default model;
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";
import apiProcessor from "../../../common/handlers/apiProcessor";

const model : ReplaceVariable = {
    definition: {
        handle: "randomAdvice",
        usage: "randomAdvice",
        description: "Get some random advice!",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        return await apiProcessor.getApiResponse("Advice");
    }
};

export default model;
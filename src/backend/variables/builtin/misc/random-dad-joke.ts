import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";
import apiProcessor from "../../../common/handlers/apiProcessor";

const model : ReplaceVariable = {
    definition: {
        handle: "randomDadJoke",
        usage: "randomDadJoke",
        description: "Get a random dad joke!",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        return await apiProcessor.getApiResponse("Dad Joke");
    }
};

export default model;
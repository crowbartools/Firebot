import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

const apiProcessor = require("../../../common/handlers/apiProcessor");

const model : ReplaceVariable = {
    definition: {
        handle: "randomDadJoke",
        usage: "randomDadJoke",
        description: "Get a random dad joke!",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: () => {
        return apiProcessor.getApiResponse("Dad Joke");
    }
};

export default model;
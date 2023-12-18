import { ReplaceVariable } from "../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";
import rawReadApi from "./read-api-raw";

const model: ReplaceVariable = {
    definition: {
        handle: "readApi",
        usage: "readApi[url]",
        description: 'Calls the given URL and returns the response as a string.',
        examples: [
            {
                usage: 'readApi[url, object.path.here]',
                description: "Traverse a JSON response object."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: async (_, url, responseJsonPath) => {
        const rawResponse = await rawReadApi.evaluator(_, url, responseJsonPath);

        if (typeof rawResponse !== "object" && !Array.isArray(rawResponse)) {
            return rawResponse ?? "";
        }

        return rawResponse ? JSON.stringify(rawResponse) : "";
    }
};

export = model;
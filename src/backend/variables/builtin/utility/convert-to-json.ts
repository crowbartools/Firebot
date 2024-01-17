import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "convertToJSON",
        description: "Converts a raw value into JSON text",
        usage: "convertToJSON[raw value]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_: unknown, jsonText: unknown) : string => {
        if (jsonText == null) {
            return "null";
        }
        try {
            return JSON.stringify(jsonText);
        } catch (ignore) {
            return "null";
        }
    }
};

export default model;
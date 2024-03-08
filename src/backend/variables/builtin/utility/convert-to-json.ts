import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "convertToJSON",
        description: "Converts a raw value into JSON text",
        usage: "convertToJSON[rawValue]",
        examples: [
            {
                usage: "convertToJSON[rawValue, true]",
                description: "Converts a raw value into pretty-printed JSON text"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        jsonText: unknown,
        prettyPrint?: string
    ) : string => {
        if (jsonText == null) {
            return "null";
        }
        try {
            return JSON.stringify(jsonText, null, prettyPrint === "true" ? 4 : null);
        } catch (ignore) {
            return "null";
        }
    }
};

export default model;
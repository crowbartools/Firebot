import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "capitalize",
        description: "Capitalizes the given text.",
        usage: "capitalize[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_: unknown, subject: unknown) : string => {
        if (typeof subject === 'string' || subject instanceof String) {
            const text = `${subject}`;

            if (text.length === 1) {
                return text.toUpperCase();
            }
            if (text.length > 1) {
                return `${text[0].toUpperCase()}${text.slice(0).toLowerCase()}`;
            }
        }
        return '';
    }
};

export default model;
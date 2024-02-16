import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "textLength",
        usage: "textLength[text]",
        description: "Returns the length of the input text",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (
        trigger: Trigger,
        text: unknown
    ) : number => {
        if (
            text === true ||
            text === false ||
            Number.isFinite(text) ||
            typeof text === 'string' ||
            text instanceof String
        ) {
            return `${text}`.length;
        }
        return 0;
    }
};

export default model;
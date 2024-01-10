import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

const model : ReplaceVariable = {
    definition: {
        handle: "uppercase",
        description: "Makes the entire given text string uppercase.",
        usage: "uppercase[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_: unknown, text: unknown) : string => {
        return convertToString(text).toUpperCase();
    }
};

export default model;
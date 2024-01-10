import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

const model : ReplaceVariable = {
    definition: {
        handle: "lowercase",
        description: "Makes the entire given text string lowercase.",
        usage: "lowercase[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_: unknown, text: unknown) : string => {
        return convertToString(text).toLowerCase();
    }
};

export default model;
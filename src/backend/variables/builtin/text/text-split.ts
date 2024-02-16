import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

const model : ReplaceVariable = {
    definition: {
        handle: "splitText",
        description: "Splits text with the given separator and returns an array. Useful for Custom Variables.",
        usage: "splitText[text, separator]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown,
        separator: unknown = ","
    ) : string[] => {
        if (subject == null) {
            return [];
        }
        return convertToString(subject).split(convertToString(separator));
    }
};

export default model;

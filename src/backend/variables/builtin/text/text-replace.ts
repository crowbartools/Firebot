import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString, escapeRegExp } from '../../../utility';

const model : ReplaceVariable = {
    definition: {
        handle: "replace",
        description: "Replaces a search value with a replacement value",
        usage: "replace[textInput, searchValue, replacement]",
        examples: [
            {
                usage: "replace[textInput, searchValue, replacement, true]",
                description: "Allows searching using a regular expression."
            },
            {
                usage: "replace[textInput, searchValue, replacement, true, flags]",
                description: "Add flags when using a regular expression."
            }
        ],
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (
        trigger: Trigger,
        input: unknown,
        search: unknown,
        replacement: unknown = "",
        searchIsRegex: unknown = false,
        flags: unknown = "g"
    ) : string => {
        if (input == null) {
            return "[Missing input]";
        }


        if (search == null) {
            return <string>input;
        }
        return convertToString(input)
            .replace(
                new RegExp(searchIsRegex ? search : escapeRegExp(search), convertToString(flags)),
                convertToString(replacement)
            );
    }
};

export default model;

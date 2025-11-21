import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify, escapeRegExp } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "replace",
        description: "Replaces a search value with a replacement value",
        usage: "replace[textInput, searchValue, replacement]",
        examples: [
            {
                usage: "replace[textInput, searchValue, replacement, true]",
                description: "Allows searching using a [regular expression](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions)."
            },
            {
                usage: "replace[textInput, searchValue, replacement, true, flags]",
                description: "Add flags when using a [regular expression](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions)."
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text", "number"]
    },
    evaluator: (
        trigger: Trigger,
        input: string,
        search: string,
        replacement: unknown = "",
        searchIsRegex = false,
        flags: unknown = "g"
    ) : string => {
        if (input == null) {
            return "[Missing input]";
        }


        if (search == null) {
            return input;
        }
        return stringify(input)
            .replace(
                new RegExp(searchIsRegex ? search : escapeRegExp(search), stringify(flags)),
                stringify(replacement)
            );
    }
};

export default model;

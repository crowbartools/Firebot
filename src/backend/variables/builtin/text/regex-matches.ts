import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "regexMatches",
        description: "Filter a string with a regular expression and return an array of all matches",
        usage: "regexMatches[string, expression]",
        examples: [
            {
                usage: "regexMatches[string, expression, flags]",
                description: "Add flags to the regex evaluation."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        stringToEvaluate: unknown,
        expression: unknown,
        flags: unknown = "g"
    ) : string[] => {
        if (!`${flags}`.includes('g')) {
            flags = `${flags}g`;
        }

        try {
            const regex = RegExp(`${expression}`, `${flags}`);
            const matches = `${stringToEvaluate}`.match(regex);
            if (!matches) {
                return [];
            }
            return [...matches];

        } catch (err) {
            return [];
        }
    }
};

export default model;
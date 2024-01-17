import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "regexTest",
        description: "Check whether a string matches a regular expression",
        usage: "regexTest[string, expression]",
        examples: [
            {
                usage: "regexTest[string, expression, flags]",
                description: "Add flags to the regex evaluation."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_: unknown, stringToEvaluate: unknown, expression: unknown, flags: unknown) : boolean => {
        try {
            const regex = RegExp(`${expression}`, `${flags}`);
            return regex.test(`${stringToEvaluate}`);
        } catch (err) {
            return false;
        }
    }
};

export default model;


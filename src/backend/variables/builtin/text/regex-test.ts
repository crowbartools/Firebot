import { ReplaceVariable, Trigger } from "../../../../types/variables";
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
    evaluator: (
        trigger: Trigger,
        stringToEvaluate: unknown,
        expression: unknown,
        flags: unknown = "g"
    ) : boolean => {
        try {
            const regex = RegExp(`${expression}`, `${flags}`);
            return regex.test(`${stringToEvaluate}`);
        } catch (err) {
            return false;
        }
    }
};

export default model;

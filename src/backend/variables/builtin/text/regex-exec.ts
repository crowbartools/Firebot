import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "regexExec",
        description: "Filter a string with a regular expression",
        usage: "regexExec[string, expression]",
        examples: [
            {
                usage: "regexExec[string, expression, flags]",
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
    ) : Array<string> => {
        try {
            const regex = RegExp(`${expression}`, `${flags}`);
            return regex
                .exec(`${stringToEvaluate}`)
                .filter(m => !!m);

        } catch (err) {
            return [];
        }
    }
};

export default model;

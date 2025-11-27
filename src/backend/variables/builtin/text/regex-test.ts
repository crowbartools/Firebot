import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "regexTest",
        description: "Check whether a string matches a [regular expression](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions)",
        usage: "regexTest[string, expression]",
        examples: [
            {
                usage: "regexTest[string, expression, flags]",
                description: "Add flags to the regex evaluation."
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"]
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
        } catch {
            return false;
        }
    }
};

export default model;

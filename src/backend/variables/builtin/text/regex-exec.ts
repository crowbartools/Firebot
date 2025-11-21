import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "regexExec",
        description: "Filter a string with a [regular expression](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions)",
        usage: "regexExec[string, expression]",
        examples: [
            {
                usage: "regexExec[string, expression, flags]",
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
    ) : Array<string> => {
        try {
            const regex = RegExp(`${expression}`, `${flags}`);
            return regex
                .exec(`${stringToEvaluate}`)
                .filter(m => !!m);

        } catch {
            return [];
        }
    }
};

export default model;

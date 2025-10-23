import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "regexMatches",
        description: "Filter a string with a [regular expression](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions) and return an array of all matches",
        usage: "regexMatches[string, expression]",
        examples: [
            {
                usage: "regexMatches[string, expression, flags]",
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

        } catch {
            return [];
        }
    }
};

export default model;
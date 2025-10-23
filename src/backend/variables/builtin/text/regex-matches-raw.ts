import type { ReplaceVariable } from "../../../../types/variables";

import regexMatches from './regex-matches';

const model : ReplaceVariable = {
    evaluator: regexMatches.evaluator,
    definition: {
        handle: "rawRegexMatches",
        description: "(Deprecated: use $regexMatches) Filter a string with a regular expression and return a raw array of all matches",
        usage: "rawRegexMatches[string, expression]",
        examples: [
            {
                usage: "rawRegexMatches[string, expression, flags]",
                description: "Add flags to the regex evaluation."
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"],
        hidden: true
    }
};

export default model;
"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawRegexMatches",
        description: "Filter a string with a regular expression and return a raw array of all matches",
        usage: "rawRegexMatches[string, expression]",
        examples: [
            {
                usage: "rawRegexMatches[string, expression, flags]",
                description: "Add flags to the regex evaluation."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, stringToEvaluate, expression, flags) => {
        if (typeof flags === 'string' || flags instanceof String) {
            flags = `${flags}`;
            if (!flags.includes('g')) {
                flags += 'g';
            }
        } else {
            flags = 'g';
        }

        const regex = RegExp(expression, flags);
        let matches = stringToEvaluate.match(regex);
        if (!matches) {
            return [];
        }
        matches = [...(matches)];
        matches.shift();
        return matches;
    }
};

module.exports = model;
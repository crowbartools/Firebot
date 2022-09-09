"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "regexMatches",
        description: "Filter a string with a regular expression and return a JSON array of all matches",
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
    evaluator: (_, stringToEvaluate, expression, flags) => {
        const regex = RegExp(expression, flags);
        const matches = stringToEvaluate.match(regex);

        return JSON.stringify([...matches]);
    }
};

module.exports = model;
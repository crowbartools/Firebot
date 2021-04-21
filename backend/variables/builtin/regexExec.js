// Migration: ?

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
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
    evaluator: (_, stringToEvaluate, expression, flags) => {
        const regex = RegExp(expression, flags);

        return regex.test(stringToEvaluate);
    }
};

module.exports = model;


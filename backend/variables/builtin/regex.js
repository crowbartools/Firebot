// Migration: ?

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "regex",
        description: "Filter a string with a regular expression",
        usage: "regex[string, expression]",
        examples: [
            {
                usage: "regex[string, expression, flags]",
                description: "Add flags to the regex evaluation."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, stringToEvaluate, expression, flags) => {
        const regex = RegExp(expression, flags);

        return regex.exec(stringToEvaluate) || "No match found.";
    }
};

module.exports = model;


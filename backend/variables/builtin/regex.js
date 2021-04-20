// Migration: ?

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "regex",
        description: "Filter a string with a regular expression",
        usage: "regex[string, expression]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, stringToEvaluate, expression) => {
        let regex = RegExp(expression);

        return regex.exec(stringToEvaluate) || null;
    }
};

module.exports = model;


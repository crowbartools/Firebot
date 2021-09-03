"use strict";

const { wildcardToRegex } = require('../../utility');
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");



const model = {
    definition: {
        handle: "wildcardMatch",
        usage: "wildcardMatch[subject, pattern]",
        description: "Returns true if the given subject matches the wildcard pattern",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, stringToEvaluate, pattern) => {
        return !!wildcardToRegex(pattern).test(stringToEvaluate);
    }
};

module.exports = model;
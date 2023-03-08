'use strict';
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawArrayFrom",
        usage: "rawArrayFrom[...values]",
        description: "Returns a raw array containing the listed values",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, ...values) => values
};

module.exports = model;
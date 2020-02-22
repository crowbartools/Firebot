"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "min",
        description: "Returns the lowest-value numbered passed",
        usage: "min[num1, num2, ...]",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, ...args) => {
        let min = Math.min(...args);

        if (isNaN(min)) {
            return 0;
        }

        return min;
    }
};

module.exports = model;


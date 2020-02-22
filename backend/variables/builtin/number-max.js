"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "max",
        description: "Returns the highest-value numbered passed",
        usage: "max[num1, num2, ...]",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, ...args) => {
        let max = Math.max(...args);

        if (isNaN(max)) {
            return 0;
        }

        return max;
    }
};

module.exports = model;


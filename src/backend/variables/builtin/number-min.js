// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "min",
        description: "Returns the lowest-value numbered passed",
        usage: "min[num1, num2, ...]",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, ...args) => {
        const min = Math.min(...args);

        if (isNaN(min)) {
            return 0;
        }

        return min;
    }
};

module.exports = model;


// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "max",
        description: "Returns the highest-value numbered passed",
        usage: "max[num1, num2, ...]",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, ...args) => {
        const max = Math.max(...args);

        if (isNaN(max)) {
            return 0;
        }

        return max;
    }
};

module.exports = model;


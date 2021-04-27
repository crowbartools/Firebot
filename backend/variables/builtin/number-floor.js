// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "floor",
        description: "Rounds down the given number to the nearest whole number.",
        usage: "floor[num]",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, number) => {

        if (isNaN(number)) {
            return 0;
        }

        return Math.floor(Number(number));
    }
};

module.exports = model;

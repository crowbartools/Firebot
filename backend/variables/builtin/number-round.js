// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "round",
        description: "Rounds the given number to the nearest whole number.",
        usage: "round[num]",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, number) => {

        if (isNaN(number)) {
            return 0;
        }

        return Math.round(Number(number));
    }
};

module.exports = model;

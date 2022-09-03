// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "round",
        description: "Rounds the given number to the nearest whole number.",
        usage: "round[num]",
        examples: [
            {
                usage: "round[num, places]",
                description: "Rounds the given number to the specified number of decimal places."
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, number, places) => {
        if (isNaN(number)) {
            return 0;
        }

        if (isNaN(places) || places < 0 || places > 100)
        {
            return Math.round(Number(number));
        }

        return Number(number).toFixed(places);
    }
};

module.exports = model;
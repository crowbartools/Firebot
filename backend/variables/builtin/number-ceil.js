// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "ceil",
        description: "Rounds up the given number to the nearest whole number.",
        usage: "ceil[num]",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, number) => {

        if (isNaN(number)) {
            return 0;
        }

        return Math.ceil(Number(number));
    }
};

module.exports = model;

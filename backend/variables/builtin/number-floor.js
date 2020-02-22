"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "floor",
        description: "Rounds down the given number to the nearest whole number.",
        usage: "floor[num]",
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

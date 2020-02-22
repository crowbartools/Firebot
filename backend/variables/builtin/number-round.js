"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "round",
        description: "Rounds the given number to the nearest whole number.",
        usage: "round[num]",
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

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "if",
        description: "Conditional output text based on the input.",
        expandedInfo: {
            examples: [

            ]
        },
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (_, condition, trueText, falseText) => {

    }
};

module.exports = model;

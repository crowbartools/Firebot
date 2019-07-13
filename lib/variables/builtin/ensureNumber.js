"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "ensureNumber",
        description: "Guarantees a number output. If the input is a number, it's passed through. If it's not, the given default number is used instead.",
        usage: "ensureNumber[input, defaultNumber]",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, input, defaultNumber = 0) => {
        if (isNaN(defaultNumber)) {
            defaultNumber = 0;
        }
        if (isNaN(input)) {
            return defaultNumber;
        }
        return input;
    }
};

module.exports = model;

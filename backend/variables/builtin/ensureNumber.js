"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "ensureNumber",
        description: "Guarantees a number output. If the input is a number, it's passed through. If it's not, the given default number is used instead.",
        usage: "ensureNumber[input, defaultNumber]",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, input, defaultNumber) => {

        // cast input as number, and if its finite return the recast input
        input = Number(input);
        if (isFinite(input)) {
            return input;
        }

        // cast defaultNumber as number and if finite return it
        defaultNumber = Number(defaultNumber);
        if (isFinite(defaultNumber)) {
            return defaultNumber;
        }

        // Defaults to 0
        return 0;
    }
};

module.exports = model;

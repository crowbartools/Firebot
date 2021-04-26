// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "ensureNumber",
        description: "Guarantees a number output. If the input is a number, it's passed through. If it's not, the given default number is used instead.",
        usage: "ensureNumber[input, defaultNumber]",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, input, defaultNumber) => {

        // cast input as number, and if its finite return the recast input
        if (input != null && input.length > 0 && !isNaN(input)) {
            return Number(input);
        }

        // cast defaultNumber as number and if finite return it
        if (defaultNumber != null && defaultNumber.length > 0 && !isNaN(defaultNumber)) {
            return Number(defaultNumber);
        }

        // Defaults to 0
        return 0;
    }
};

module.exports = model;

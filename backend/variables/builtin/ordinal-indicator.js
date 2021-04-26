"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const nth = n => ["st", "nd", "rd"][(((n < 0 ? -n : n) + 90) % 100 - 10) % 10 - 1] || "th";

const model = {
    definition: {
        handle: "ordinalIndicator",
        description: "Adds an ordinal indicator suffix to a number (ie 'st', 'nd', 'rd')",
        usage: "ordinalIndicator[number]",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, number) => {

        // cast input as number, and if its finite return the recast input
        if (number == null || isNaN(number)) {
            return number;
        }

        const parsed = parseInt(number);

        return parsed + nth(parsed);
    }
};

module.exports = model;

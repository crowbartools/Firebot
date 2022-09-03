"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "padNumber",
        description: "Pads the given number up to the specified number of decimal places.",
        usage: "padNumber[value, places]",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, value, places) => {
        if (!value || !places) {
            return value;
        }

        const [integer, fraction] = `0${value}.0`.split(/\./g);

        return `${Number(integer)}.${fraction.padEnd(places, "0")}`;
    }
};

module.exports = model;
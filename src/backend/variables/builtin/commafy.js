// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "commafy",
        description: "Adds the appropriate commas to a number.",
        usage: "commafy[number]",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, number) => {
        if (isNaN(number)) {
            return "[Error: not a number]";
        }
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
};

module.exports = model;

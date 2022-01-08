// Migration: done

"use strict";

const util = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");


const model = {
    definition: {
        handle: "randomNumber",
        usage: "randomNumber[min, max]",
        description: "Get a random number between the given range.",
        categories: [VariableCategory.COMMON, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, min, max) => {
        return util.getRandomInt(min, max);
    }
};

module.exports = model;

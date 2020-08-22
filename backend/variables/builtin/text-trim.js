// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "trim",
        description: "Removes any whitespace from the beginning and end of input text.",
        usage: "trim[text]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? text.trim() : "";
    }
};

module.exports = model;

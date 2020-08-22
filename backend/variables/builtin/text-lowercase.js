// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "lowercase",
        description: "Makes the entire given text string lowercase.",
        usage: "lowercase[text]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? text.toLowerCase() : "";
    }
};

module.exports = model;

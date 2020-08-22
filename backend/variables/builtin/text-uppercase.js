// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "uppercase",
        description: "Makes the entire given text string uppercase.",
        usage: "uppercase[text]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? text.toUpperCase() : "";
    }
};

module.exports = model;

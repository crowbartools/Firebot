// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "uppercase",
        description: "Makes the entire given text string uppercase.",
        usage: "uppercase[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? text.toUpperCase() : "";
    }
};

module.exports = model;

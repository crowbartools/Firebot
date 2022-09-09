// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "lowercase",
        description: "Makes the entire given text string lowercase.",
        usage: "lowercase[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? text.toLowerCase() : "";
    }
};

module.exports = model;

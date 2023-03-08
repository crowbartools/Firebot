// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawSplitText",
        description: "Splits text with the given separator and returns a raw array. Useful for Custom Variables.",
        usage: "rawSplitText[text, separator]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text, separator = ",") => {
        return text ? text.split(separator) : [];
    }
};

module.exports = model;

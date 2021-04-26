// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "textSubstring",
        usage: "textSubstring[text, start, end]",
        description: "Returns a substring of the provided text based on the range",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text = "", start = 0, end) => {
        start--;
        if (start < 0) {
            start = 0;
        }
        if (end == null) {
            end = start + 1;
        }
        const value = text.substring(start, end);
        return value;
    }
};

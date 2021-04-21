// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "textContains",
        usage: "textContains[text, search]",
        description: "Returns true if text contains search, otherwise returns false",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text = "", search = "") => {
        return text.toString().includes(search);
    }
};

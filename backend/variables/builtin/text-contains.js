// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

module.exports = {
    definition: {
        handle: "textContains",
        usage: "textContains[text, search]",
        description: "Returns true if text contains search, otherwise returns false",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text = "", search = "") => {
        return text.toString().includes(search);
    }
};

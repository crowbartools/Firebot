// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "splitText",
        description: "Splits text with the given separator and returns a JSON array. Useful for Custom Variables.",
        usage: "splitText[text, separator]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text, separator = ",") => {
        return text ? JSON.stringify(text.split(separator)) : "null";
    }
};

module.exports = model;

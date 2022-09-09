"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "decodeFromUrl",
        description: "Decodes input text from a URL-encoded string",
        usage: "decodeFromUrl[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? decodeURIComponent(text) : "";
    }
};

module.exports = model;

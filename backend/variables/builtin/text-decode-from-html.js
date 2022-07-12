"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const he = require('he');

const model = {
    definition: {
        handle: "decodeFromHtml",
        description: "Decodes input text from an HTML-encoded string",
        usage: "decodeFromHtml[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? he.decode(text) : "";
    }
};

module.exports = model;

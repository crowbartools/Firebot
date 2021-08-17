// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const he = require('he');

const model = {
    definition: {
        handle: "encodeForHtml",
        description: "Encodes input text for safe use within HTML templates",
        usage: "encodeForHtml[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? he.encode(text) : "";
    }
};

module.exports = model;

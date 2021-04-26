// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "encodeForUrl",
        description: "Encodes input text for use in a URL",
        usage: "encodeForUrl[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? encodeURIComponent(text) : "";
    }
};

module.exports = model;

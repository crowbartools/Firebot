"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "encodeForUrl",
        description: "Encodes input text for use in a URL",
        usage: "encodeForUrl[text]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? encodeURIComponent(text) : "";
    }
};

module.exports = model;

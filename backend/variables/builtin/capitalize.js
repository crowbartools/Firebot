"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "capitalize",
        description: "Capitalizes the given text.",
        usage: "capitalize[text]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text.replace(/^\w/, c => c.toUpperCase());
    }
};

module.exports = model;

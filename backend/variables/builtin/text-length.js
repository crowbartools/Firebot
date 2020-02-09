'use strict';

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "textLength",
        usage: "textLength[text]",
        description: "Returns the length of the input text",
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (_, text) => {
        return text.length;
    }
};

module.exports = model;
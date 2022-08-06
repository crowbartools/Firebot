// Migration: done

'use strict';

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "textLength",
        usage: "textLength[text]",
        description: "Returns the length of the input text",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, text) => {
        return text ? text.length : 0;
    }
};

module.exports = model;
'use strict';
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "convertToJSON",
        description: "Converts a raw value into JSON text",
        usage: "convertToJSON[raw value]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, jsonText) => {
        if (jsonText == null) {
            return "null";
        }
        try {
            return JSON.stringify(jsonText);
        } catch (ignore) {
            return "null";
        }
    }
};

module.exports = model;
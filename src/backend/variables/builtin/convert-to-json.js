'use strict';
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "converttoJSON",
        description: "Converts a raw value into JSON text",
        usage: "convertToJSON[raw value]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, jsonText) => {
        if (jsonText == null) {
            return "null";
        }
        return JSON.stringify(jsonText);
    }
};

module.exports = model;
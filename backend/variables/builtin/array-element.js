'use strict';

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "arrayElement",
        usage: "arrayElement[jsonArray, index]",
        description: "Returns the element at the given index of the input JSON array.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (_, jsonArray, index) => {
        if (jsonArray) {
            try {
                let array = JSON.parse(jsonArray);
                if (Array.isArray(array)) {
                    return array[index];
                }
            } catch (error) {
                //fail silently
            }
        }
        return null;
    }
};

module.exports = model;
'use strict';
const utils = require("../../utility");

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
            const array = utils.jsonParse(jsonArray);
            if (Array.isArray(array)) {
                // Check value for being array or object, otherwise return raw value
                if (Array.isArray(array[index]) || Object.prototype.toString.call(array[index]) === "[object Object]") {
                    return JSON.stringify(array[index]);
                }
                return array[index];
            }
        }
        return null;
    }
};

module.exports = model;

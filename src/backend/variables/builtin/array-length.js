// Migration: done

'use strict';
const utils = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "arrayLength",
        usage: "arrayLength[jsonArray]",
        description: "Returns the length of the input JSON array.",
        categories: [VariableCategory.ADVANCED, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, jsonArray) => {
        let length = 0;
        if (jsonArray) {
            const array = utils.jsonParse(jsonArray);
            if (Array.isArray(array)) {
                length = array.length;
            }
        }
        return length;
    }
};

module.exports = model;
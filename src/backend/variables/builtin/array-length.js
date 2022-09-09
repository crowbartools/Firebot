// Migration: done

'use strict';

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
            try {
                const array = JSON.parse(jsonArray);
                if (Array.isArray(array)) {
                    length = array.length;
                }
            } catch (error) {
                //fail silently
            }
        }
        return length;
    }
};

module.exports = model;
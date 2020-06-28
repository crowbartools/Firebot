// Migration: done

'use strict';

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "arrayLength",
        usage: "arrayLength[jsonArray]",
        description: "Returns the length of the input JSON array.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, jsonArray) => {
        let length = 0;
        if (jsonArray) {
            try {
                let array = JSON.parse(jsonArray);
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
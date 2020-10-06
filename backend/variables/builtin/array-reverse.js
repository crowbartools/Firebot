'use strict';
const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "arrayReverse",
        usage: "arrayReverse[jsonArray]",
        description: "Returns a new reversed array",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, jsonArray) => {
        if (jsonArray) {
            try {
                const array = JSON.parse(jsonArray);
                if (Array.isArray(array)) {
                    return JSON.stringify(array.reverse());
                }
            } catch (error) {
                //fail silently
            }
        }
        return JSON.stringify([]);
    }
};

module.exports = model;
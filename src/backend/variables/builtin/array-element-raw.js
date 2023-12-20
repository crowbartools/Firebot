'use strict';
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawArrayElement",
        usage: "rawArrayElement[rawArray, index]",
        description: "Returns the element at the given index of the input raw array.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (_, rawArray, index) => {
        if (typeof rawArray === 'string' || rawArray instanceof String) {
            try {
                rawArray = JSON.parse(`${rawArray}`);

            //eslint-disable-next-line no-empty
            } catch (ignore) {}
        }

        if (Array.isArray(rawArray)) {
            return rawArray[index] || null;
        }
        return null;
    }
};

module.exports = model;
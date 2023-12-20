'use strict';
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawArrayLength",
        usage: "rawArrayLength[jsonArray]",
        description: "Returns the length of the input raw array.",
        categories: [VariableCategory.ADVANCED, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, rawArray) => {
        if (typeof rawArray === 'string' || rawArray instanceof String) {
            try {
                rawArray = JSON.parse(`${rawArray}`);

            //eslint-disable-next-line no-empty
            } catch (ignore) {}
        }

        if (Array.isArray(rawArray)) {
            return rawArray.length;
        }
        return 0;
    }
};

module.exports = model;
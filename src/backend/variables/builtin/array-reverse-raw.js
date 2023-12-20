'use strict';
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawArrayReverse",
        usage: "rawArrayReverse[someRawArray]",
        description: "Returns a new reversed array",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, rawArray) => {
        if (typeof rawArray === 'string' || rawArray instanceof String) {
            try {
                rawArray = JSON.parse(`${rawArray}`);

            //eslint-disable-next-line no-empty
            } catch (ignore) {}
        }
        if (!Array.isArray(rawArray)) {
            return [];
        }
        return rawArray.map(v => v).reverse();
    }
};

module.exports = model;
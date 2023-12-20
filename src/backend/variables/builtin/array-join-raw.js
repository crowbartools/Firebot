'use strict';
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawArrayJoin",
        usage: "rawArrayJoin[raw, separator]",
        description: "Returns a string with each array item joined together with the given separator",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, rawArray, separator = ",") => {
        if (typeof rawArray === 'string' || rawArray instanceof String) {
            try {
                rawArray = JSON.parse(`${rawArray}`);

            //eslint-disable-next-line no-empty
            } catch (ignore) {}
        }
        if (Array.isArray(rawArray)) {
            return rawArray.join(separator);
        }
        return "";
    }
};

module.exports = model;
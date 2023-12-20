'use strict';

const utils = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawArrayShuffle",
        usage: "rawArrayShuffle[someRawArray]",
        description: "Returns a new shuffled array",
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
        return utils.shuffleArray(rawArray.map(v => v));
    }
};

module.exports = model;
'use strict';

const utils = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "arrayShuffle",
        usage: "arrayShuffle[jsonArray]",
        description: "Returns a new shuffled array",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, jsonArray) => {
        if (jsonArray) {
            try {
                const array = JSON.parse(jsonArray);
                if (Array.isArray(array)) {
                    return JSON.stringify(utils.shuffleArray(array));
                }
            } catch (error) {
                //fail silently
            }
        }
        return JSON.stringify([]);
    }
};

module.exports = model;
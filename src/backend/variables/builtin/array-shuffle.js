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
            const array = utils.jsonParse(jsonArray);
            if (Array.isArray(array)) {
                return JSON.stringify(utils.shuffleArray(array));
            }
        }
        return JSON.stringify([]);
    }
};

module.exports = model;
'use strict';
const utils = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "arraySort",
        usage: "arraySort[jsonArray]",
        description: "Returns a new sorted array",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, jsonArray) => {
        if (jsonArray) {
            const array = utils.jsonParse(jsonArray);
            if (Array.isArray(array)) {
                return JSON.stringify(array.sort());
            }
        }
        return JSON.stringify([]);
    }
};

module.exports = model;
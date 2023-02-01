'use strict';
const utils = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "arrayJoin",
        usage: "arrayJoin[jsonArray, separator]",
        description: "Returns a string with each array item joined together with the given separator",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, jsonArray, separator = ",") => {
        if (jsonArray) {
            const array = utils.jsonParse(jsonArray);
            if (Array.isArray(array)) {
                return array.join(separator);
            }
        }
        return jsonArray;
    }
};

module.exports = model;
'use strict';

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
            try {
                const array = JSON.parse(jsonArray);
                if (Array.isArray(array)) {
                    return array.join(separator);
                }
            } catch (error) {
                //fail silently
            }
        }
        return jsonArray;
    }
};

module.exports = model;
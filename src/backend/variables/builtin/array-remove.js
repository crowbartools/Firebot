// Migration: done

'use strict';
const utils = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "arrayRemove",
        usage: "arrayRemove[jsonArray, index]",
        description: "Returns a new array with the element at the given index removed",
        examples: [
            {
                usage: 'arrayRemove["[1,2,3]", 0]',
                description: "Removes the element at the 0 index (2,3)"
            },
            {
                usage: 'arrayRemove["[1,2,3]", last]',
                description: 'Removes the element at the last index (1,2)'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, jsonArray, index = 0) => {
        if (jsonArray != null) {
            const array = utils.jsonParse(jsonArray);
            if (Array.isArray(array)) {
                if (isNaN(index) && index === "last") {
                    index = array.length - 1;
                } else if (isNaN(index)) {
                    index = -1;
                }
                if (index < array.length && index > -1) {
                    array.splice(index, 1);
                    return JSON.stringify(array);
                }
            }
            return jsonArray;
        }
        return JSON.stringify([]);
    }
};

module.exports = model;
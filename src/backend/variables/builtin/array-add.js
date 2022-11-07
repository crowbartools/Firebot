// Migration: done

'use strict';
const utils = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "arrayAdd",
        usage: "arrayAdd[jsonArray, newElement]",
        examples: [
            {
                usage: 'arrayAdd["[1,2,3]", 4]',
                description: "Adds 4 to the end of the array. (1,2,3,4)"
            },
            {
                usage: 'arrayAdd["[1,2,3]", 4, true]',
                description: 'Adds 4 to the beginning of the array. (4,1,2,3)'
            }
        ],
        description: "Returns a new array with the added element",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, jsonArray, newElement, addToFront = false) => {
        if (jsonArray != null) {
            addToFront = addToFront === true || addToFront === 'true';
            const array = utils.jsonParse(jsonArray);
            if (Array.isArray(array)) {
                //attempt to parse newElement as json
                newElement = utils.jsonParse(newElement);

                if (addToFront) {
                    array.unshift(newElement);
                } else {
                    array.push(newElement);
                }
                return JSON.stringify(array);
            }
        }
        return JSON.stringify([]);
    }
};

module.exports = model;
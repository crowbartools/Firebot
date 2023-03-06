'use strict';

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawArrayAdd",
        usage: "rawArrayAdd[array, newElement]",
        examples: [
            {
                usage: 'rawArrayAdd[some_array, 4]',
                description: "Returns a new raw array after appending 4 to the end of the input raw array"
            },
            {
                usage: 'rawArrayAdd[some_array, 4, true]',
                description: 'Retruns a new raw array after prepending 4 to the start of the input raw array'
            }
        ],
        description: "Returns a new array with the added element",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, rawArray, newElement, addToFront = false) => {
        if (typeof rawArray === 'string' || rawArray instanceof String) {
            try {
                rawArray = JSON.parse('' + rawArray);

            //eslint-disable-next-line no-empty
            } catch (ignore) {}
        }
        if (rawArray == null || rawArray === '' || !Array.isArray(rawArray)) {
            return [newElement];
        }

        const clone = rawArray.map(item => item);
        if (addToFront === true) {
            clone.unshift(newElement);
            return clone;
        }

        clone.push(newElement);
        return clone;
    }
};

module.exports = model;
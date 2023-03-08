'use strict';
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawArrayRemove",
        usage: "rawArrayRemove[someRawArray, index]",
        description: "Returns a new array with the element at the given index removed",
        examples: [
            {
                usage: 'rawArrayRemove[someRawArray, 0]',
                description: "Removes the element at the 0 index"
            },
            {
                usage: 'rawArrayRemove[someRawArray, last]',
                description: 'Removes the element at the last index'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, rawArray, index = 0) => {
        if (typeof rawArray === 'string' || rawArray instanceof String) {
            try {
                rawArray = JSON.parse('' + rawArray);

            //eslint-disable-next-line no-empty
            } catch (ignore) {}
        }

        if (!Array.isArray(rawArray)) {
            return [];
        }

        if (isNaN(index) && index === "last") {
            index = rawArray.length - 1;

        } else if (isNaN(index)) {
            index = -1;
        }

        const clone = rawArray.map(v => v);
        if (index < rawArray.length && index > -1) {
            clone.splice(index, 1);
        }
        return clone;
    }
};

module.exports = model;
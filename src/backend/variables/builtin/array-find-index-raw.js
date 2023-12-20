// Migration: done

'use strict';
const utils = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

function getPropertyAtPath(obj, propertyPath) {
    let data = obj;
    const pathNodes = propertyPath.split(".");
    for (let i = 0; i < pathNodes.length; i++) {
        if (data == null) {
            break;
        }
        let node = pathNodes[i];
        // parse to int for array access
        if (!isNaN(node)) {
            node = parseInt(node);
        }
        data = data[node];
    }
    return data;
}

const model = {
    definition: {
        handle: "rawArrayFindIndex",
        usage: "rawArrayFindIndex[rawarray, matcher, propertyPath]",
        description: "Finds a matching element in the array and returns it's index, or null if the element is absent",
        examples: [
            {
                usage: 'rawArrayFindIndex[someRawArray, b]',
                description: 'Returns 1, the index of "b"'
            },
            {
                usage: 'rawArrayFindIndex[someRawArray, value, key]',
                description: 'Searches the array for an item with a key with the value of "value"'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (_, rawArray, matcher, propertyPath = null) => {
        if (typeof rawArray === 'string' || rawArray instanceof String) {
            try {
                rawArray = JSON.parse(`${rawArray}`);

            //eslint-disable-next-line no-empty
            } catch (ignore) {}
        }

        if (!Array.isArray(rawArray) || matcher === undefined) {
            return null;
        }

        if (typeof matcher === 'string' || matcher instanceof String) {
            matcher = utils.jsonParse(`${matcher}`);
        }

        if (propertyPath === 'null' || propertyPath === "") {
            propertyPath = null;
        }

        let found;

        // propertyPath arg not specified
        if (propertyPath == null || propertyPath === "") {
            found = rawArray.findIndex(v => v === matcher);

        // property path specified
        } else {
            found = rawArray.findIndex(v => {
                const property = getPropertyAtPath(v, propertyPath);
                return property === matcher;
            });
        }
        return found !== -1 ? found : null;
    }
};

module.exports = model;
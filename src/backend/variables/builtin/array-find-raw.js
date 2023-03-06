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
        handle: "rawArrayFind",
        usage: "rawArrayFind[someRawArray, matcher, propertyPath]",
        description: "Returns the first found matching element from the raw array or returns null if no matchers are found",
        examples: [
            {
                usage: 'rawArrayFind[someRawArray, value]',
                description: 'Searches each item in the array for "value" and returns the first matched item'
            },
            {
                usage: 'rawArrayFind[someRawArray, value, key]',
                description: 'Searches each item in the array for an item that has a "key" property that equals "value"'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (_, rawArray, matcher, propertyPath = null) => {
        if (typeof rawArray === 'string' || rawArray instanceof String) {
            try {
                rawArray = JSON.parse('' + rawArray);

            //eslint-disable-next-line no-empty
            } catch (ignore) {}
        }
        if (!Array.isArray(rawArray) || matcher === undefined || matcher === "") {
            return null;
        }

        if (typeof matcher === 'string' || matcher instanceof String) {
            matcher = utils.jsonParse('' + matcher);
        }

        let found;

        // propertyPath arg not specified
        if (propertyPath == null || propertyPath === "") {
            found = rawArray.find(v => v === matcher);

        // property path specified
        } else {
            found = rawArray.find(v => {
                const property = getPropertyAtPath(v, propertyPath);
                return property === matcher;
            });
        }
        return found != null ? found : null;
    }
};

module.exports = model;
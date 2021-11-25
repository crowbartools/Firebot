// Migration: done

'use strict';

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
        handle: "arrayFilter",
        usage: "arrayFilter[jsonArray, matcher, propertyPath, removeMatches]",
        examples: [
            {
                usage: 'arrayFilter["[1,2,3]", 1, null, false]',
                description: "Filter out anything that doesn't equal 1 (new array: [1])"
            },
            {
                usage: 'arrayFilter["[1,2,3]", 1, null, true]',
                description: 'Filter out anything that equals 1 (new array: [2,3])'
            },
            {
                usage: 'arrayFilter["[{\\"username\\": \\"ebiggz\\"},{\\"username\\": \\"MageEnclave\\"}]", ebiggz, username, true]',
                description: 'Filter out anything that has a username property which equals "ebiggz" (new array: [{\\"username\\": \\"MageEnclave\\"}])'
            }
        ],
        description: "Returns a new filtered array.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, jsonArray, matcher, propertyPath = null, removeMatches = false) => {
        if (jsonArray != null) {
            if (matcher === undefined || matcher === "") {
                return jsonArray;
            }

            try {
                matcher = JSON.parse(matcher);
            } catch (err) {
                //fail silently
            }

            if (propertyPath === 'null' || propertyPath === "") {
                propertyPath = null;
            }

            // eslint-disable-next-line eqeqeq
            removeMatches = removeMatches === true || removeMatches === 'true';

            try {
                const array = JSON.parse(jsonArray);
                if (Array.isArray(array)) {
                    if (propertyPath == null || propertyPath === "") {
                        const newArray = removeMatches ? array.filter(v => v !== matcher) : array.filter(v => v === matcher);
                        return JSON.stringify(newArray);
                    }
                    const newArray = array.filter(v => {
                        const property = getPropertyAtPath(v, propertyPath);
                        return removeMatches ? property !== matcher : property === matcher;
                    });
                    return JSON.stringify(newArray);
                }
            } catch (error) {
                // fail silently
            }
        }
        return JSON.stringify([]);
    }
};

module.exports = model;
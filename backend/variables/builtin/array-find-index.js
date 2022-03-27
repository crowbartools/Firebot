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
        handle: "arrayFindIndex",
        usage: "arrayFindIndex[jsonArray, matcher, propertyPath]",
        description: "Finds a matching element in the array and returns it's index, or null if the element is absent",
        examples: [
            {
                usage: 'arrayFindIndex["[\\"a\\",\\"b\\",\\"c\\"]", b]',
                description: 'Returns 1 , the index of "b"'
            },
            {
                usage: 'arrayFindIndex["[{\\"username\\": \\"alastor\\"},{\\"username\\": \\"ebiggz\\"}]", alastor, username]',
                description: 'Returns 0, the index of the object where "username"="alastor"'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (_, jsonArray, matcher, propertyPath = null) => {
        if (jsonArray != null) {
            if (matcher === undefined || matcher === "") {
                return null;
            }

            try {
                matcher = JSON.parse(matcher);
            } catch (err) {
                return null;
            }

            if (propertyPath === 'null' || propertyPath === "") {
                propertyPath = null;
            }

            try {
                const array = JSON.parse(jsonArray);
                if (Array.isArray(array)) {
                    let found;

                    // propertyPath arg not specified
                    if (propertyPath == null || propertyPath === "") {
                        found = array.findIndex(v => v === matcher);

                    // property path specified
                    } else {
                        found = array.findIndex(v => {
                            const property = getPropertyAtPath(v, propertyPath);
                            return property === matcher;
                        });
                    }
                    return JSON.stringify(found != -1 ? found : null);
                }
            } catch (error) {
                return null;
            }
        }
        return null;
    }
};

module.exports = model;
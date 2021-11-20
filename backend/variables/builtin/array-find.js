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
        handle: "arrayFind",
        usage: "arrayFind[jsonArray, matcher, propertyPath]",
        description: "Finds a matching element in the array or null",
        examples: [
            {
                usage: 'arrayFind["[1,2,3]", 1]',
                description: "Finds 1 in the array"
            },
            {
                usage: 'arrayFind["[{\\"username\\": \\"ebiggz\\"},{\\"username\\": \\"MageEnclave\\"}]", ebiggz, username]',
                description: 'Finds object with username of "ebiggz"'
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
                //fail silently
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
                        found = array.find(v => v === matcher);

                    // property path specified
                    } else {
                        found = array.find(v => {
                            const property = getPropertyAtPath(v, propertyPath);
                            return property === matcher;
                        });
                    }
                    return JSON.stringify(found != null ? found : null);
                }
            } catch (error) {
                // fail silently
            }
        }
        return null;
    }
};

module.exports = model;
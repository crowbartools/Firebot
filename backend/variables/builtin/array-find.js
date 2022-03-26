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
        usage: "arrayFind[jsonArray, matcher, propertyPath, returnIndex]",
        description: "Finds a matching element in the array or null. Returns either the object index or the object",
        examples: [
            {
                usage: 'arrayFind["[\\"a\\",\\"b\\",\\"c\\"]", b]',
                description: 'Returns "b"'
            },
            {
                usage: 'arrayFind["[{\\"username\\": \\"ebiggz\\"},{\\"username\\": \\"MageEnclave\\"}]", ebiggz, username]',
                description: 'Returns the object where "username"="ebiggz"'
            },
            {
                usage: 'arrayFind["[\\"a\\",\\"b\\",\\"c\\"]", b, null, true]',
                description: 'Returns 1, the index of "b"'
            },
            {
                usage: 'arrayFind["[{\\"username\\": \\"ebiggz\\"},{\\"username\\": \\"MageEnclave\\"}]", ebiggz, username, true]',
                description: 'Returns 0, the index of the object where "username"="ebiggz"'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (_, jsonArray, matcher, propertyPath = null, returnIndex = false) => {
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

            if (returnIndex === 'true') {
                returnIndex = true;
            } else {
                returnIndex = false;
            }

            try {
                const array = JSON.parse(jsonArray);
                if (Array.isArray(array)) {
                    let found;
                    // returning the index has been requested
                    if (returnIndex) {
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
                    // returning the index has not been requested
                    } else {
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
                }
            } catch (error) {
                // fail silently
            }
        }
        return null;
    }
};

module.exports = model;
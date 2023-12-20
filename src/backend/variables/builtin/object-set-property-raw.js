"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const logger = require('../../logwrapper');

const model = {
    definition: {
        handle: "rawSetObjectProperty",
        description: "Adds or updates a property's value in the raw object. For nested properties, you can use dot notation (e.g. some.property). Set value to null to remove property.",
        usage: "rawSetObjectProperty[object, propertyPath, value]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, object, propertyPath, value) => {
        if (object == null) {
            object = {};
        } else if (typeof object === 'string' || object instanceof String) {
            try {
                object = JSON.parse(`${object}`);
            } catch (ignore) {
                logger.error("Invalid JSON object specified", object);
                return;
            }
        }

        if (propertyPath == null || propertyPath.length < 1) {
            logger.error("Property path must be specified");
            return;
        }

        if (typeof value === 'string' || value instanceof String) {
            try {
                value = JSON.parse(value);

            //eslint-disable-next-line no-empty
            } catch (ignore) {
                value = "null";
            }
        }

        try {
            let cursor = object;
            const valueRaw = value != null ? value.toString().toLowerCase() : "null";
            const valueIsNull = valueRaw === "null" || valueRaw === "undefined";

            const pathNodes = propertyPath.split(".");
            for (let i = 0; i < pathNodes.length; i++) {
                let node = pathNodes[i];

                // Parse to int for array access
                if (!isNaN(node)) {
                    node = parseInt(node);
                }

                const isLastItem = i === pathNodes.length - 1;
                if (isLastItem) {
                    // If data recognized as null and cursor is an array, remove index instead of setting value
                    if (valueIsNull && Array.isArray(cursor) && !isNaN(node)) {
                        cursor.splice(node, 1);
                    } else {
                        // If next node is an array and we detect we are not setting a new array or removing array, then push data to array
                        if (Array.isArray(cursor[node]) && !Array.isArray(value) && !valueIsNull) {
                            cursor[node].push(value);
                        } else {
                            cursor[node] = valueIsNull ? undefined : value;
                        }
                    }
                } else {
                    cursor = cursor[node];
                }
            }
        } catch (error) {
            logger.debug(`Error updating JSON object using property path ${propertyPath}`);
        }

        return object;
    }
};

module.exports = model;
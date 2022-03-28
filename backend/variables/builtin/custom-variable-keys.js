"use strict";

const customVariableManager = require("../../common/custom-variable-manager");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

function isObject(data) {
    return typeof data === 'object' && !(data instanceof String);
}

const model = {
    definition: {
        handle: "customVariableKeys",
        usage: "customVariableKeys[name]",
        examples: [
            {
                usage: "customVariableKeys[name, 1]",
                description: "Get the array of keys for an object which is an array item by providing an array index as a second argument."
            },
            {
                usage: "customVariableKeys[name, property]",
                description: "Get the array of keys for an object property by providing a property path (using dot notation) as a second argument."
            }
        ],
        description: "Get the array of keys for an object saved in the custom variable.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, name, propertyPath) => {
        const data = customVariableManager.getCustomVariable(name, propertyPath);
        if (data == null || !isObject(data)) {
           return "[]"; // same as JSON.stringify([]);
        }

        let keys = Object.keys(data);
        return JSON.stringify(keys);
    }
};


module.exports = model;

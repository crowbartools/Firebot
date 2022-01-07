// Migration: done

"use strict";

const customVariableManager = require("../../common/custom-variable-manager");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

function isObjectOrArray(data) {
    return Array.isArray(data) || (typeof data === 'object' && !(typeof data === 'string' || data instanceof String));
}

const model = {
    definition: {
        handle: "customVariable",
        usage: "customVariable[name]",
        examples: [
            {
                usage: "customVariable[name, 1]",
                description: "Get an array item by providing an array index as a second argument."
            },
            {
                usage: "customVariable[name, property]",
                description: "Get a property by providing a property path (using dot notation) as a second argument."
            },
            {
                usage: "customVariable[name, null, exampleString]",
                description: "Set a default value in case the custom variable doesn't exist yet."
            }
        ],
        description: "Get the data saved in the custom variable.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (_, name, propertyPath, defaultData) => {
        let data = customVariableManager.getCustomVariable(name, propertyPath, defaultData);
        if (data && isObjectOrArray(data)) {
            data = JSON.stringify(data);
        }
        return data != null ? data : "null";
    }
};


module.exports = model;

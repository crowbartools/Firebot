"use strict";
const customVariableManager = require("../../common/custom-variable-manager");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawCustomVariable",
        usage: "rawCustomVariable[name]",
        examples: [
            {
                usage: "rawCustomVariable[name, 1]",
                description: "Get an array item by providing an array index as a second argument."
            },
            {
                usage: "rawCustomVariable[name, property]",
                description: "Get a property by providing a property path (using dot notation) as a second argument."
            },
            {
                usage: "rawCustomVariable[name, null, exampleString]",
                description: "Set a default value in case the custom variable doesn't exist yet."
            }
        ],
        description: "Get the data saved in the custom variable.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (_, name, propertyPath, defaultData) => {
        const data = customVariableManager.getCustomVariable(name, propertyPath, defaultData);
        if (data == null) {
            return null;
        }
        return data;
    }
};


module.exports = model;

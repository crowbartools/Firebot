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
        description: "Get the data saved in the custom variable. Optionally provide a property path (using dot notation) or array index as a second argument.",
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

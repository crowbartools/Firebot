// Migration: done

"use strict";

const customVariableManager = require("../../common/custom-variable-manager");

const { OutputDataType } = require("../../../shared/variable-contants");

function isObjectOrArray(data) {
    return Array.isArray(data) || (typeof data === 'object' && !(typeof data === 'string' || data instanceof String));
}

const model = {
    definition: {
        handle: "customVariable",
        usage: "customVariable[name]",
        description: "Get the data saved in the custom variable. Optionally provide a property path (using dot notation) or array index as a second argument.",
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (_, name, propertyPath) => {
        let data = customVariableManager.getCustomVariable(name, propertyPath);
        if (data && isObjectOrArray(data)) {
            data = JSON.stringify(data);
        }
        return data || "null";
    }
};


module.exports = model;

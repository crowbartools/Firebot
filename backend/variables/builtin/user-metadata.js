"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

function isObjectOrArray(data) {
    return Array.isArray(data) || (typeof data === 'object' && !(typeof data === 'string' || data instanceof String));
}

const model = {
    definition: {
        handle: "userMetadata",
        usage: "userMetadata[username, metadataKey]",
        examples: [
            {
                usage: "userMetadata[username, metadataKey, defaultValue]",
                description: "Provide a default value if one doesn't exist for the user."
            },
            {
                usage: "userMetadata[username, metadataKey, null, propertyPath]",
                description: "Provide a property path (using dot notation) or array index as a second argument."
            }
        ],
        description: "Get the metadata associated with the user.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: async (_, username, key, defaultValue = null, propertyPath = null) => {
        const userDb = require("../../database/userDatabase");
        let data = await userDb.getUserMetadata(username, key, propertyPath);
        if (data && isObjectOrArray(data)) {
            data = JSON.stringify(data);
        }
        return data != null ? data : defaultValue;
    }
};


module.exports = model;

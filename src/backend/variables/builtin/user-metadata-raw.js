"use strict";
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "rawUserMetadata",
        usage: "rawUserMetadata[username, metadataKey]",
        examples: [
            {
                usage: "rawUserMetadata[username, metadataKey, defaultValue]",
                description: "Provide a default value if one doesn't exist for the user."
            },
            {
                usage: "rawUserMetadata[username, metadataKey, null, propertyPath]",
                description: "Provide a property path (using dot notation) or array index as a second argument."
            }
        ],
        description: "Get the raw metadata associated with the user.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: async (_, username, key, defaultValue = null, propertyPath = null) => {
        const userDb = require("../../database/userDatabase");
        const data = await userDb.getUserMetadata(username, key, propertyPath);
        if (data == null) {
            return defaultValue;
        }
        return data;
    }
};


module.exports = model;

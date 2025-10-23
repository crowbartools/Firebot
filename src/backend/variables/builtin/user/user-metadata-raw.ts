import type { ReplaceVariable } from "../../../../types/variables";

import userMetadata from './user-metadata';

const model : ReplaceVariable = {
    definition: {
        handle: "rawUserMetadata",
        description: "(Deprecated: use $userMetaData) Get the raw metadata associated with the user.",
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

        categories: ["advanced"],
        possibleDataOutput: ["number", "text"],
        hidden: true
    },
    evaluator: userMetadata.evaluator
};

export default model;

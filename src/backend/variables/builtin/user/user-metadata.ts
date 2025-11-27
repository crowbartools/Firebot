import type { ReplaceVariable } from "../../../../types/variables";

import viewerMetadataManager from "../../../viewers/viewer-metadata-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "userMetadata",
        description: "Get the metadata associated with the user.",
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
        categories: ["advanced"],
        possibleDataOutput: ["number", "text"]
    },

    evaluator: async (_, username: string, key: string, defaultValue = null, propertyPath: string = null) => {
        const data = await viewerMetadataManager.getViewerMetadata(username, key, propertyPath);

        if (data == null) {
            return defaultValue;
        }

        return data;
    }
};


export default model;

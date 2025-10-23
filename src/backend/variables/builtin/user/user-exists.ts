import type { ReplaceVariable } from "../../../../types/variables";

import viewerDatabase from "../../../viewers/viewer-database";

const model : ReplaceVariable = {
    definition: {
        handle: "userExists",
        usage: "userExists[username]",
        description: "Outputs 'true' if a user exists in Firebot's database, 'false' if not",
        categories: ["advanced"],
        possibleDataOutput: ["text", "bool"]
    },
    evaluator: async (_, username: string) => {
        const user = await viewerDatabase.getViewerByUsername(username);
        return user != null;
    }
};

export default model;

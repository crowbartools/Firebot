import type { ReplaceVariable } from "../../../../types/variables";

import viewerDatabase from "../../../viewers/viewer-database";

const model : ReplaceVariable = {
    definition: {
        handle: "usernameArray",
        description: "Returns an array of all usernames saved in the user db",
        categories: ["advanced"],
        possibleDataOutput: ["array"]
    },
    evaluator: async () => {
        const usernames = await viewerDatabase.getAllUsernames();
        return usernames;
    }
};

export default model;

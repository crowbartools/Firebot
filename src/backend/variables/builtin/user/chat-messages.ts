import type { ReplaceVariable } from "../../../../types/variables";

import viewerDatabase from "../../../viewers/viewer-database";

const model : ReplaceVariable = {
    definition: {
        handle: "chatMessages",
        usage: "chatMessages",
        description: "Displays the number of chat messages for a viewer (leave blank to use current viewer)",
        examples: [
            {
                usage: "chatMessages",
                description: "Returns the number of chat messages for the current viewer"
            },
            {
                usage: "chatMessages[username]",
                description: "Returns the number of chat messages for the specified user"
            }
        ],
        categories: ["user based"],
        possibleDataOutput: ["number"]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null) {
            username = trigger.metadata.username;
        }
        const viewer = await viewerDatabase.getViewerByUsername(username);
        if (!viewer) {
            return 0;
        }
        return viewer.chatMessages || 0;
    }
};

export default model;

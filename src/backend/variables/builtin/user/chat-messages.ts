import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

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
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.NUMBER]
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

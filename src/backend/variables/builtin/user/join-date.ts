import type { ReplaceVariable } from "../../../../types/variables";
import viewerDatabase from "../../../viewers/viewer-database";
import { DateTime } from "luxon";

const model : ReplaceVariable = {
    definition: {
        handle: "joinDate",
        usage: "joinDate",
        description: "Displays the date that a viewer was first seen in chat (by Firebot).",
        examples: [
            {
                usage: "joinDate",
                description: "Returns the join date for the current viewer."
            },
            {
                usage: "joinDate[username]",
                description: "Returns the join date for the specified viewer."
            }
        ],
        categories: ["user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null) {
            username = trigger.metadata.username;
        }
        const viewer = await viewerDatabase.getViewerByUsername(username);
        if (!viewer) {
            return "Unknown User";
        }

        return DateTime.fromMillis(viewer.joinDate).toUTC().toFormat("yyyy-MM-dd");
    }
};

export default model;

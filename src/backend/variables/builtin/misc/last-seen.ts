import type { ReplaceVariable } from "../../../../types/variables";
import viewerDatabase from "../../../viewers/viewer-database";
import { DateTime } from "luxon";

const model : ReplaceVariable = {
    definition: {
        handle: "lastSeen",
        usage: "lastSeen",
        description: "Displays the date that a viewer was last seen in chat (by Firebot).",
        examples: [
            {
                usage: "lastSeen",
                description: "Returns the last seen date for the current viewer."
            },
            {
                usage: "lastSeen[username]",
                description: "Returns the last seen date for the specified viewer."
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
        return DateTime.fromMillis(viewer.lastSeen).toUTC().toFormat("yyyy-MM-dd");
    }
};

export default model;

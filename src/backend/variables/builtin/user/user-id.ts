import type { ReplaceVariable } from "../../../../types/variables";

import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import viewerDatabase from "../../../viewers/viewer-database";
import logger from "../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "userId",
        usage: "userId",
        description: "Gets the user ID of the associated user (if there is one) for the given trigger.",
        categories: ["user based"],
        possibleDataOutput: ["text"],
        examples: [
            {
                usage: "userId[username]",
                description: "The user ID for the given username. Searches local viewer DB first, then Twitch API."
            }
        ]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null) {
            const userId = trigger.metadata?.eventData?.userid ?? trigger.metadata?.userId;
            if (userId != null) {
                return userId;
            }
            username = (trigger.metadata?.eventData?.username ?? trigger.metadata?.username) as string;
            if (username == null) {
                return "[No username available]";
            }
        }
        const viewer = await viewerDatabase.getViewerByUsername(username);
        if (viewer != null) {
            return viewer._id;
        }

        try {
            const user = await TwitchApi.users.getUserByName(username);
            if (user != null) {
                return user.id;
            }
            return "[No user found]";
        } catch (error) {
            logger.debug(`Unable to find user with name "${username}"`, error);
            return "[Error]";
        }
    }
};

export default model;

import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import logger from "../../../logwrapper";
import viewerDatabase from "../../../viewers/viewer-database";
import twitchApi from "../../../twitch-api/api";

const model : ReplaceVariable = {
    definition: {
        handle: "userDisplayName",
        usage: "userDisplayName",
        description: "Gets the formatted display name of the associated user (if there is one) for the given trigger.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT],
        examples: [
            {
                usage: "userDisplayName[username]",
                description: "The formatted display name for the given username. Searches local viewer DB first, then Twitch API."
            }
        ]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null) {
            const userDisplayName = trigger.metadata?.eventData?.userDisplayName ?? trigger.metadata?.userDisplayName;
            if (userDisplayName != null) {
                return userDisplayName;
            }
            username = trigger.metadata?.eventData?.username ?? trigger.metadata?.username;
            if (username == null) {
                return "[No username available]";
            }
        }
        const viewer = await viewerDatabase.getViewerByUsername(username);
        if (viewer != null) {
            return viewer.displayName;
        }

        try {
            const user = await twitchApi.users.getUserByName(username);
            if (user != null) {
                return user.displayName;
            }
            return "[No user found]";
        } catch (error) {
            logger.debug(`Unable to find user with name "${username}"`, error);
            return "[Error]";
        }
    }
};

export default model;

import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import logger from "../../../logwrapper";
import viewerDatabase from "../../../viewers/viewer-database";
import twitchApi from "../../../twitch-api/api";

const model : ReplaceVariable = {
    definition: {
        handle: "userId",
        usage: "userId[username]",
        description: "Gets the user ID for the given username. Searches local viewer DB first, then Twitch API.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null) {
            const userId = trigger.metadata.userid ?? trigger.metadata.userId;
            if (userId != null) {
                return userId;
            }
            username = trigger.metadata.username;
            if (username == null) {
                return "[No username available]";
            }
        }
        const viewer = await viewerDatabase.getViewerByUsername(username);
        if (viewer != null) {
            return viewer._id;
        }

        try {
            const user = await twitchApi.users.getUserByName(username);
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

import moment from "moment";

import type { ReplaceVariable } from "../../../../types/variables";

import { AccountAccess } from "../../../common/account-access";
import { TwitchApi } from "../api";
import logger from "../../../logwrapper";


const model : ReplaceVariable = {
    definition: {
        handle: "accountCreationDate",
        description: "The creation date of your Twitch account.",
        examples: [
            {
                usage: "accountCreationDate[$target]",
                description: "When in a command, gets the creation date for the target user's Twitch account."
            },
            {
                usage: "accountCreationDate[$user]",
                description: "Gets the creation date for associated user's Twitch account (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "accountCreationDate[ChannelOne]",
                description: "Gets the creation date for a specific user's Twitch account/channel."
            }
        ],
        categories: ["user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null) {
            username = AccountAccess.getAccounts().streamer.username;
        }

        try {
            const user = await TwitchApi.users.getUserByName(username);

            if (user && user.creationDate) {
                const creationDate = moment.utc(user.creationDate).format("YYYY-MM-DD HH:mm UTC");
                return creationDate;
            }

            return null;
        } catch (error) {
            logger.debug("Failed to get account creation date", error);
            return null;
        }
    }
};
export default model;
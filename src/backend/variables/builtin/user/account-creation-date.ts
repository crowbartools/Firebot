import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const moment = require("moment");

const twitchApi = require("../../../twitch-api/api");
const accountAccess = require("../../../common/account-access");
const logger = require("../../../logwrapper");

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
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username) => {
        if (username == null) {
            username = accountAccess.getAccounts().streamer.username;
        }

        try {
            const user = await twitchApi.users.getUserByName(username);

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
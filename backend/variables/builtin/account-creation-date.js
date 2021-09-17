"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const api = require("../../twitch-api/api");
const accountAccess = require("../../common/account-access");
const moment = require("moment");

const model = {
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
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, username) => {
        if (username == null) {
            username = accountAccess.getAccounts().streamer.username;
        }

        try {
            const user = await api.getClient().helix.users.getUserByName(username);

            if (user && user.creationDate) {
                const creationDate = moment.utc(user.creationDate).format("YYYY-MM-DD HH:mm UTC");
                return creationDate;
            }
        } catch {
            // silently fail
        }
    }
};

module.exports = model;
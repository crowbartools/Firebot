// Migration: done

'use strict';

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const api = require("../../twitch-api/api");
const accountAccess = require("../../common/account-access");

const model = {
    definition: {
        handle: "followCount",
        description: "The number of follows you currently have.",
        examples: [
            {
                usage: "followCount[$target]",
                description: "When in a command, gets the follow count for the target user."
            },
            {
                usage: "followCount[$user]",
                description: "Gets the follow count for associated user (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "followCount[ChannelOne]",
                description: "Gets the follow count for a specific channel."
            }
        ],
        categories: [VariableCategory.NUMBERS, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (_, username) => {
        let count = 0;

        const streamer = accountAccess.getAccounts().streamer;

        if (username == null) {
            username = streamer.username;
        }

        try {
            const user = await api.users.getUserByName(username);

            const response = await api.getClient().channels.getChannelFollowers(
                user.id,
                streamer.userId
            );
            if (response) {
                count = response.total;
            }
        } catch {
            // silently fail
        }

        return count;
    }
};

module.exports = model;
"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const twitchApi = require("../../twitch-api/api");

const model = {
    definition: {
        handle: "bitsCheered",
        usage: "bitsCheered",
        description: "Returns the all-time number of bits the specified user has cheered in the streamer's channel.",
        examples: [
            {
                usage: "bitsCheered[username]",
                description: "Returns the all-time number of bits the specified user has cheered in the streamer's channel."
            },
            {
                usage: "bitsCheered[username, period]",
                description: "Returns the number of bits the specified user has cheered in the streamer's channel during the specified period. Period can be 'day', 'week', 'month', 'year', or 'all'."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username = null, period = "all") => {
        username = username ?? trigger.metadata.username;
        period = period ?? "all";

        const users = await twitchApi.bits.getChannelBitsLeaderboard(1, period, username);

        if (users.length === 0) {
            return 0;
        }

        return users[0].amount;
    }
};

module.exports = model;

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const twitchApi = require("../../twitch-api/api");

const model = {
    definition: {
        handle: "topBitsCheerers",
        description: "Returns a JSON array containing the username of the top user who has cheered the most bits in the streamer's channel all-time.",
        examples: [
            {
                usage: "topBitsCheerers[count]",
                description: "Returns a JSON array of the usernames up to the specified count, of the users who have cheered the most bits in the streamer's channel all-time."
            },
            {
                usage: "topBitsCheerers[count, period]",
                description: "Returns a JSON array of the usernames up to the specified count, of the users who have cheered the most bits in the streamer's channel during the specified period. Period can be 'day', 'week', 'month', 'year', or 'all'."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, count = 1, period = "all") => {
        count = count ?? 1;
        period = period ?? "all";

        const users = await twitchApi.bits.getChannelBitsTopCheerers(count, period);

        return JSON.stringify(users);
    }
};

module.exports = model;

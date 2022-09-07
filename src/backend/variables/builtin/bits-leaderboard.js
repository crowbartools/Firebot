"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const expressionish = require('expressionish');
const twitchApi = require("../../twitch-api/api");

const model = {
    definition: {
        handle: "bitsLeaderboard",
        usage: "bitsLeaderboard[count]",
        description: "Returns a JSON array of the all-time bits leaderboard of the streamer's channel, up to the specified count. Each object in the array has a `username` and `amount`.",
        examples: [
            {
                usage: "bitsLeaderboard[count, period]",
                description: "Returns a JSON array of the bits leaderboard of the streamer's channel during the specified period, up to the specified count. Each object in the array has a `username` and `amount`. Period can be 'day', 'week', 'month', 'year', or 'all'."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    argsCheck: (count = 1, period = "all") => {
        if (count == null && period == null) {
            return true;
        }

        if (Number.isNaN(count) || count < 1 || count > 100) {
            throw new expressionish.ExpressionArgumentsError("First argument needs to be either null or a number.", 0);
        }

        const validPeriods = ["day", "week", "month", "year", "all"];
        period = period.toLowerCase();

        if (validPeriods.findIndex(period) === -1) {
            throw new expressionish.ExpressionArgumentsError("Second argument must be a valid period ('day', 'week', 'month', 'year', or 'all').", 0);
        }

        return true;
    },
    evaluator: async (_, count = 1, period = "all") => {
        count = count ?? 1;
        period = (period ?? "all").toLowerCase();

        const leaderboard = await twitchApi.bits.getChannelBitsLeaderboard(count, period);

        return JSON.stringify(leaderboard.map(l => {
            return {
                username: l.username,
                amount: l.amount
            };
        }));
    }
};

module.exports = model;

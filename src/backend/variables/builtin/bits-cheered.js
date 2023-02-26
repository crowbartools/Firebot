"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const expressionish = require('expressionish');
const moment = require("moment");
const logger = require("../../logwrapper");
const twitchApi = require("../../twitch-api/api");

const model = {
    definition: {
        handle: "bitsCheered",
        usage: "bitsCheered[username]",
        description: "Returns the all-time number of bits the specified user has cheered in the streamer's channel.",
        examples: [
            {
                usage: "bitsCheered[username, period]",
                description: "Returns the number of bits the specified user has cheered in the streamer's channel during the current specified period. Period can be 'day', 'week', 'month', 'year', or 'all'."
            },
            {
                usage: "bitsCheered[username, period, startDate]",
                description: "Returns the number of bits the specified user has cheered in the streamer's channel during the specified period that occurred on the specified date. Period can be 'day', 'week', 'month', 'year', or 'all'."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    argsCheck: (username, period = "all", startDate = null) => {
        period = period ?? "all";

        if (username == null || username.length < 1) {
            throw new expressionish.ExpressionArgumentsError("First argument needs to be a valid username.", 0);
        }

        const validPeriods = ["day", "week", "month", "year", "all"];
        period = period.toLowerCase();

        if (validPeriods.indexOf(period) === -1) {
            throw new expressionish.ExpressionArgumentsError("Second argument must be a valid period ('day', 'week', 'month', 'year', or 'all').", 0);
        }

        if (startDate != null && !moment(startDate).isValid()) {
            throw new expressionish.ExpressionArgumentsError("Third argument must be a valid date string.", 0);
        }

        return true;
    },
    evaluator: async (trigger, username = null, period = "all", startDate = null) => {
        username = username ?? trigger.metadata.username;
        period = period ?? "all";
        startDate = startDate == null ? moment() : moment(startDate);

        let amount = 0;

        try {
            const user = await twitchApi.users.getUserByName(username);

            if (user == null) {
                logger.warn(`Could not found a Twitch user with the username ${username}`);
                return 0;
            }

            const users = await twitchApi.bits.getChannelBitsLeaderboard(1, period, startDate.toDate(), user.id);

            if (users.length === 0) {
                return 0;
            }

            amount = users.length === 1 ? users[0].amount : 0;
        } catch (error) {
            // Swallow exception
        }

        return amount;
    }
};

module.exports = model;

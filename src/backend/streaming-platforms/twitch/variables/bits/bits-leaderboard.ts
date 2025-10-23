import type { HelixBitsLeaderboardPeriod } from "@twurple/api";
import moment from "moment";

import type { ReplaceVariable, Trigger } from "../../../../../types/variables";
import { TwitchApi } from "../../api";

const expressionish = require('expressionish');

const model : ReplaceVariable = {
    definition: {
        handle: "bitsLeaderboard",
        usage: "bitsLeaderboard[count]",
        description: "Returns an array of the all-time bits leaderboard of the streamer's channel, up to the specified count. Each object in the array has a `username` and `amount`.",
        examples: [
            {
                usage: "bitsLeaderboard[count, period]",
                description: "Returns an array of the bits leaderboard of the streamer's channel during the current specified period, up to the specified count. Each object in the array has a `username` and `amount`. Period can be 'day', 'week', 'month', 'year', or 'all'."
            },
            {
                usage: "bitsLeaderboard[count, period, startDate]",
                description: "Returns an array of the bits leaderboard of the streamer's channel during the specified period that occurred on the specified date, up to the specified count. Each object in the array has a `username` and `amount`. Period can be 'day', 'week', 'month', 'year', or 'all'."
            }
        ],
        categories: ["common", "advanced"],
        possibleDataOutput: ["array"]
    },
    argsCheck: (
        count: null | number = 1,

        period: string = "all",
        startDate = null
    ) => {
        if (count == null && period == null && startDate == null) {
            return true;
        }

        period = period ?? "all";

        if (Number.isNaN(count) || count < 1 || count > 100) {
            throw new expressionish.ExpressionArgumentsError("First argument needs to be either null or a number.", 0);
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
    evaluator: async (
        trigger: Trigger,
        count: number = 10,
        period: string = "all",
        startDate = null
    ) => {
        count = count ?? 1;
        period = (period ?? "all").toLowerCase();
        startDate = startDate == null ? moment() : moment(startDate);

        const leaderboard = await TwitchApi.bits.getChannelBitsLeaderboard(count, (period as HelixBitsLeaderboardPeriod), (<any>startDate).toDate());

        return leaderboard.map((l) => {
            return {
                username: l.userName,
                userId: l.userId,
                userDisplayName: l.userDisplayName,
                amount: l.amount
            };
        });
    }
};

export default model;

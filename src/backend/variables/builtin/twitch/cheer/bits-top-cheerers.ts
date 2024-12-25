import { ReplaceVariable, Trigger } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const expressionish = require('expressionish');
const moment = require("moment");
const twitchApi = require("../../../../twitch-api/api");

const model : ReplaceVariable = {
    definition: {
        handle: "topBitsCheerers",
        description: "Returns an array containing the username of the top user who has cheered the most bits in the streamer's channel all-time.",
        examples: [
            {
                usage: "topBitsCheerers[count]",
                description: "Returns an array of the usernames up to the specified count, of the users who have cheered the most bits in the streamer's channel all-time."
            },
            {
                usage: "topBitsCheerers[count, period]",
                description: "Returns an array of the usernames up to the specified count, of the users who have cheered the most bits in the streamer's channel during the current specified period. Period can be 'day', 'week', 'month', 'year', or 'all'."
            },
            {
                usage: "topBitsCheerers[count, period, startDate]",
                description: "Returns an array of the usernames up to the specified count, of the users who have cheered the most bits in the streamer's channel during the specified period that occurred on the specified date. Period can be 'day', 'week', 'month', 'year', or 'all'."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.ARRAY]
    },
    argsCheck: (count: null | number = 1, period: null | string = "all", startDate = null) => {
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
        count: null | number = 1,
        period: null | string = "all",
        startDate = null
    ) : Promise<unknown[]> => {
        count = count ?? 1;
        period = period ?? "all";
        startDate = startDate == null ? moment() : moment(startDate);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const users = await twitchApi.bits.getChannelBitsTopCheerers(count, period, (<any>startDate).toDate());

        return users;
    }
};

export default model;

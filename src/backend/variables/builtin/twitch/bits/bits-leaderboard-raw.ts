import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

import bitsLeaderboard from './bits-leaderboard';

const model : ReplaceVariable = {
    definition: {
        handle: "rawBitsLeaderboard",
        description: "(Deprecated: use $bitsLeaderboard) Returns a raw array of the all-time bits leaderboard of the streamer's channel, up to the specified count. Each item in the array has a `username` and `amount` property",
        usage: "rawBitsLeaderboard[count]",
        examples: [
            {
                usage: "rawBitsLeaderboard[count, period]",
                description: "Returns a raw array of the bits leaderboard of the streamer's channel during the current specified period, up to the specified count. Each object in the array has a `username` and `amount`. Period can be 'day', 'week', 'month', 'year', or 'all'."
            },
            {
                usage: "rawBitsLeaderboard[count, period, startDate]",
                description: "Returns a raw array of the bits leaderboard of the streamer's channel during the specified period that occurred on the specified date, up to the specified count. Each object in the array has a `username` and `amount`. Period can be 'day', 'week', 'month', 'year', or 'all'."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ARRAY],
        hidden: true
    },
    evaluator: bitsLeaderboard.evaluator,
    argsCheck: bitsLeaderboard.argsCheck
};

export default model;

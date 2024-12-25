import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

import topBitsCheerers from './bits-top-cheerers';

const model : ReplaceVariable = {
    definition: {
        handle: "rawTopBitsCheerers",
        description: "(Deprecated: use $topBitsCheerers) Returns a raw array containing the username of the top user who has cheered the most bits in the streamer's channel all-time.",
        examples: [
            {
                usage: "rawTopBitsCheerers[count]",
                description: "Returns a raw array of the usernames up to the specified count, of the users who have cheered the most bits in the streamer's channel all-time."
            },
            {
                usage: "rawTopBitsCheerers[count, period]",
                description: "Returns a raw array of the usernames up to the specified count, of the users who have cheered the most bits in the streamer's channel during the current specified period. Period can be 'day', 'week', 'month', 'year', or 'all'."
            },
            {
                usage: "rawTopBitsCheerers[count, period, startDate]",
                description: "Returns a raw array of the usernames up to the specified count, of the users who have cheered the most bits in the streamer's channel during the specified period that occurred on the specified date. Period can be 'day', 'week', 'month', 'year', or 'all'."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.ARRAY],
        hidden: true
    },
    argsCheck: topBitsCheerers.argsCheck,
    evaluator: topBitsCheerers.evaluator
};

export default model;

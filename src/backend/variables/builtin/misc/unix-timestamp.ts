import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const moment = require("moment");

const model : ReplaceVariable = {
    definition: {
        handle: "unixTimestamp",
        examples: [
            {
                usage: "unixTimestamp[date]",
                description: "Provided date formatted as miliseconds since January 1, 1970 00:00:00 UTC."
            }
        ],
        description: "The current date formatted as miliseconds since January 1, 1970 00:00:00 UTC",
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: (_, date?: string) => {
        const time = date ? moment(new Date(date)) : moment();

        return time.unix();
    }
};

export default model;

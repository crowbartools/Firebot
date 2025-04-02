import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const moment = require("moment");

const model : ReplaceVariable = {
    definition: {
        handle: "unixTimestamp",
        examples: [
            {
                usage: "unixTimestamp[2011-03-18 18:49 UTC]",
                description: "Unix timestamp for provided date"
            },
            {
                usage: "unixTimestamp[07/28/2024, MM/DD/YYYY]",
                description: 'Unix timestamp for provided date with specified format.  Format uses <a href="https://momentjs.com/docs/#/displaying/format/">moment.js</a> formatting rules.'
            },
            {
                usage: "unixTimestamp[$accountCreationDate]",
                description: "Unix timestamp for provided account creation date"
            },
            {
                usage: "unixTimestamp[$date[MMM Do YYYY, -14, days], MMM Do YYYY]",
                description: "Unix timestamp for date variable set to 2 weeks ago formatted as MMM Do YYYY"
            }
        ],
        description: "The current date formatted as seconds since January 1, 1970 00:00:00 UTC",
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: (_, date?: string, format?: string) => {
        const time = moment(date, format);

        return time.unix();
    }
};

export default model;

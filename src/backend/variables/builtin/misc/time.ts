import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const moment = require("moment");

const model : ReplaceVariable = {
    definition: {
        handle: "time",
        description: "Outputs the current time.",
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT],
        examples: [
            {
                usage: "time[format]",
                description: 'Outputs the current time in a specific format. Format uses <a href="https://momentjs.com/docs/#/displaying/format/">moment.js</a> formatting rules.'
            },
            {
                usage: "time[YYYY-DD-MM HH:mm:ss]",
                description: "Format with the preferred tokens."
            }
        ]
    },
    evaluator: (_, format = 'h:mm a') => {
        const now = moment();
        return now.format(format.toString());
    }
};

export default model;
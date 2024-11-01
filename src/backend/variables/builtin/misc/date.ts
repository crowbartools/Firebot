import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const moment = require("moment");

const model : ReplaceVariable = {
    definition: {
        handle: "date",
        examples: [
            {
                usage: "date[dddd MMMM Do]",
                description: 'Format with the preferred tokens. Format uses <a href="https://momentjs.com/docs/#/displaying/format/">moment.js</a> formatting rules.'
            },
            {
                usage: "date[YYYY-DD-MM HH:mm:ss]",
                description: "Format with the preferred tokens."
            },
            {
                usage: "date[MMM Do YYYY, 2, days]",
                description: "Adds 2 days to the current date (or use other units i.e. months, years, etc.)."
            },
            {
                usage: "date[MMM Do YYY, -2, days]",
                description: "Subtract 2 days from the current date (or use other units i.e. months, years, etc.)."
            }
        ],
        description: "The current date formatted as MMM Do YYYY",
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: (_, template = 'MMM Do YYYY', steps: number = 0, key) => {
        const now = moment();

        if (steps > 0 && key !== null) {
            now.add(steps, key);
        }

        if (steps < 0 && key !== null) {
            now.subtract(Math.abs(steps), key);
        }

        return now.format(template.toString());
    }
};

export default model;

// Migration: done

"use strict";

const moment = require("moment");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "date",
        examples: [
            {
                usage: "date[dddd MMMM Do]",
                description: "Format with the preferred tokens."
            },
            {
                usage: "date[MMM Do YYY, 2, days]",
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
    evaluator: (_, template = 'MMM Do YYYY', steps = 0, key) => {
        let now = moment();

        if (steps > 0 && key !== null) {
            now.add(steps, key);
        }

        if (steps < 0 && key !== null) {
            now.subtract(Math.abs(steps), key);
        }

        return now.format(template.toString());
    }
};

module.exports = model;

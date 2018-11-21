"use strict";

const moment = require("moment");

/**
 * The $time24 variable
 */
const model = {
    definition: {
        handle: "time24",
        description: "Outputs the current time as 24 hour clock."
    },
    evaluator: (_, template = 'HH:mm') => {
        let now = moment();
        return now.format(template.toString());
    }
};

module.exports = model;

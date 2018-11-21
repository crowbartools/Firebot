"use strict";

const moment = require("moment");

/**
 * The $time24 variable
 */
const model = {
    definition: {
        handle: "date",
        description: "The current date formatted as MMM Do YYYY"
    },
    evaluator: (_, template = 'MMM Do YYYY') => {
        let now = moment();
        return now.format(template.toString());
    }
};

module.exports = model;

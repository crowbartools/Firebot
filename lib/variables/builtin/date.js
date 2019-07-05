"use strict";

const moment = require("moment");

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

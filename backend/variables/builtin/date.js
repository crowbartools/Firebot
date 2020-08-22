// Migration: done

"use strict";

const moment = require("moment");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "date",
        description: "The current date formatted as MMM Do YYYY",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, template = 'MMM Do YYYY') => {
        let now = moment();
        return now.format(template.toString());
    }
};

module.exports = model;

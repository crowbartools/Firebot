"use strict";

const moment = require("moment");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "time24",
        description: "Outputs the current time as 24 hour clock.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, template = 'HH:mm') => {
        let now = moment();
        return now.format(template.toString());
    }
};

module.exports = model;

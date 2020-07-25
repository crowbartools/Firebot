// Migration: done

"use strict";

const moment = require("moment");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "time",
        description: "Outputs the current time.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, template = 'h:mm a') => {
        let now = moment();
        return now.format(template.toString());
    }
};

module.exports = model;

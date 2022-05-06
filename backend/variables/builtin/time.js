// Migration: done

"use strict";

const moment = require("moment");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "time",
        description: "Outputs the current time.",
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, template = 'h:mm a') => {
        const now = moment();
        return now.format(template.toString());
    }
};

module.exports = model;

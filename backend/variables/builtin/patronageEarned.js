"use strict";

const patronageManager = require("../../patronageManager");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "patronageEarned",
        description: "The current amount of sparks earned for patronage.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: () => {
        return patronageManager.getPatronageData().channel.patronageEarned || 0;
    }
};

module.exports = model;

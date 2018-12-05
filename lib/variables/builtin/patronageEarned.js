"use strict";

const patronageManager = require("../../patronageManager");

const model = {
    definition: {
        handle: "patronageEarned",
        description: "The current amount of sparks earned for patronage."
    },
    evaluator: () => {
        return patronageManager.getPatronageData().channel.patronageEarned;
    }
};

module.exports = model;

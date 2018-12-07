"use strict";

const patronageManager = require("../../patronageManager");

const model = {
    definition: {
        handle: "patronageNextMilestoneReward",
        description: "The next patronage milestone reward."
    },
    evaluator: () => {
        let currentMilestone = patronageManager.getCurrentMilestone();
        if (currentMilestone) {
            return currentMilestone.reward / 100;
        }
        return 0;
    }
};

module.exports = model;

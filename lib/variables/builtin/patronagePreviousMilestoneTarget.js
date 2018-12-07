"use strict";

const patronageManager = require("../../patronageManager");

const model = {
    definition: {
        handle: "patronagePreviousMilestoneTarget",
        description: "The previous patronage milestone target."
    },
    evaluator: () => {
        let previousMilestone = patronageManager.getPreviousMilestone();
        if (previousMilestone) {
            return previousMilestone.target;
        }
        return 0;
    }
};

module.exports = model;

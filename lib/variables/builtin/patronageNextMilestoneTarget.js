"use strict";

const patronageManager = require("../../patronageManager");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "patronageNextMilestoneTarget",
        description: "The next patronage milestone target.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: () => {
        let currentMilestone = patronageManager.getCurrentMilestone();
        if (currentMilestone) {
            return currentMilestone.target;
        }
        return 0;
    }
};

module.exports = model;

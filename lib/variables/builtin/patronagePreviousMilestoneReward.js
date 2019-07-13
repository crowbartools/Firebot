"use strict";

const patronageManager = require("../../patronageManager");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "patronagePreviousMilestoneReward",
        description: "The previous patronage milestone reward.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: () => {
        let previousMilestone = patronageManager.getPreviousMilestone();
        if (previousMilestone) {
            return previousMilestone.reward / 100;
        }
        return 0;
    }
};

module.exports = model;

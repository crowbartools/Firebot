"use strict";

const patronageManager = require("../../patronageManager");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "patronageNextMilestoneReward",
        description: "The next patronage milestone reward.",
        possibleDataOutput: [OutputDataType.NUMBER]
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

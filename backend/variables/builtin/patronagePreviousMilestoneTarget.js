"use strict";

const patronageManager = require("../../patronageManager");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "patronagePreviousMilestoneTarget",
        description: "The previous patronage milestone target.",
        possibleDataOutput: [OutputDataType.NUMBER]
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

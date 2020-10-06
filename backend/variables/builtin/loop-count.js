// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "loopCount",
        usage: "loopCount",
        description: "0 based count for the current loop iteration inside of a Loop Effects effect",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.loopCount || 0;
    }
};

module.exports = model;

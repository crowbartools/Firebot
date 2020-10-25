"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "loopItem",
        usage: "loopItem",
        description: "The item for current loop iteration inside of a Loop Effects effect using Array loop mode",
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.loopItem;
    }
};

module.exports = model;

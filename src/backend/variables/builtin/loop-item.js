"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "loopItem",
        usage: "loopItem",
        description: "The item for current loop iteration inside of a Loop Effects effect using Array loop mode",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.loopItem;
    }
};

module.exports = model;

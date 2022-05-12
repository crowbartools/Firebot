"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "effectOutput",
        usage: "effectOutput[name]",
        description: "Get data that was outputted by a prior effect.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: ({ effectOutputs }, name = "") => {
        return (effectOutputs ?? {})[name] ?? "";
    }
};

module.exports = model;

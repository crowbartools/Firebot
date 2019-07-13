"use strict";

const customVariableManager = require("../../common/custom-variable-manager");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "customVariable",
        usage: "customVariable[name]",
        description: "Get the data saved in the custom variable.",
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (_, name) => {
        let data = customVariableManager.getCustomVariable(name);
        return data ? data : "[Can't Find Variable]";
    }
};

module.exports = model;

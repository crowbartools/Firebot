"use strict";

const customVariableManager = require("../../common/custom-variable-manager");

const model = {
    definition: {
        handle: "customVariable",
        usage: "customVariable[name]",
        description: "Get the data saved in the custom variable."
    },
    evaluator: (_, name) => {
        let data = customVariableManager.getCustomVariable(name);
        return data ? data : "[Can't Find Variable]";
    }
};

module.exports = model;

"use strict";

const utils = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "evalVars",
        usage: "evalVars[text]",
        description: "Evaluate $variables in a string of text. Useful for evaluating text $vars from an external source (ie a txt file or API)",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, text = "") => {
        return await utils.populateStringWithTriggerData(text, trigger);
    }
};

module.exports = model;

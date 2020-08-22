"use strict";

const utils = require("../../utility");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "evalVars",
        description: "Evalate $variables in a string of text. Useful for evaluating text $vars from an external source (ie a txt file or API)",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, text = "") => {
        return await utils.populateStringWithTriggerData(text, trigger);
    }
};

module.exports = model;

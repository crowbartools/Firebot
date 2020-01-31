"use strict";


const { OutputDataType } = require("../../../shared/variable-contants");

const util = require("../../utility");

const model = {
    definition: {
        handle: "capitalize",
        description: "Capitalizes the given text.",
        usage: "capitalize[text]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? util.capitalize(text) : "";
    }
};

module.exports = model;

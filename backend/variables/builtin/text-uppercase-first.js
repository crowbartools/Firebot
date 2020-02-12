"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "uppercaseFirst",
        description: "Uppercases the first alpha character and lowercases the rest",
        usage: "uppercaseFirst[text]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return (text || '').toLowerCase().replace(/[a-z]/, '$&'.toUpperCase());
    }
};

module.exports = model;
"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const utils = require("../../utility");

const model = {
    definition: {
        handle: "replace",
        description: "Replaces a search value with a replacement value",
        usage: "replace[textInput, searchValue, replacement]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, input, search, replacement) => {

        if (input == null || search == null || replacement == null) {
            return "[Missing values]";
        }

        let escapedSearch = utils.escapeRegExp(search);

        return input.replace(new RegExp(escapedSearch), replacement);
    }
};

module.exports = model;

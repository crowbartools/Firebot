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
    evaluator: (_, input, search, replacement = "") => {

        if (input == null) {
            return "[Missing input]";
        }

        if (search == null) {
            return input;
        }

        let escapedSearch = utils.escapeRegExp(search);

        return input.replace(new RegExp(escapedSearch, "g"), replacement);
    }
};

module.exports = model;

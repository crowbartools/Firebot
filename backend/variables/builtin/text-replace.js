// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-contants");

const utils = require("../../utility");

const model = {
    definition: {
        handle: "replace",
        description: "Replaces a search value with a replacement value",
        usage: "replace[textInput, searchValue, replacement]",
        examples: [
            {
                usage: "replace[textInput, searchValue, replacement, true]",
                description: "Allows searching using a regular expression."
            },
            {
                usage: "replace[textInput, searchValue, replacement, flags, true]",
                description: "Add flags when using a regular expression."
            }
        ],
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, input, search, replacement = "", flags = "g", searchIsRegex = false) => {

        if (input == null) {
            return "[Missing input]";
        }

        if (search == null) {
            return input;
        }

        return input.replace(new RegExp(searchIsRegex ? search : utils.escapeRegExp(search), flags), replacement);
    }
};

module.exports = model;

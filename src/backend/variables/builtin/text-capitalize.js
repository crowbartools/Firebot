// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const util = require("../../utility");

const model = {
    definition: {
        handle: "capitalize",
        description: "Capitalizes the given text.",
        usage: "capitalize[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        return text ? util.capitalize(text) : "";
    }
};

module.exports = model;

// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "splitText",
        description: "Splits text with the given seperator and returns a JSON array. Useful for Custom Variables.",
        usage: "splitText[text, seperator]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text, seperator = ",") => {
        return text ? JSON.stringify(text.split(seperator)) : "null";
    }
};

module.exports = model;

'use strict';

const { OutputDataType } = require("../../../shared/variable-contents");

const model = {
    definition: {
        handle: "concat",
        description: "Appends text together",
        usage: "concat[text, text, ...]",
        possibleDataOuput: [OutputDataType.TEXT]
    },
    evaluator: (_, ...args) => args.reduce((res, cur) => res + String(cur), "")
};

module.exports = model;
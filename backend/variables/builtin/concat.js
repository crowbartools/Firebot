// Migration: done

'use strict';

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "concat",
        description: "Appends text together",
        usage: "concat[text, text, ...]",
        possibleDataOuput: [OutputDataType.TEXT]
    },
    evaluator: (_, ...args) => args.join('')
};

module.exports = model;
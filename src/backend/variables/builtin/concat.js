// Migration: done

'use strict';

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "concat",
        description: "Appends text together",
        usage: "concat[text, text, ...]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, ...args) => args.join('')
};

module.exports = model;
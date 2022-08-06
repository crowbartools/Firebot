// Migration: done

'use strict';

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "scrambleText",
        usage: "scrambleText[text]",
        description: "Scrambles the input text",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        text = text.split('');

        let result = '';
        while (text.length) {
            const idx = Math.floor(Math.random() * text.length);
            result += text[idx];
            text.splice(idx, 1);
        }

        return result;
    }
};

module.exports = model;
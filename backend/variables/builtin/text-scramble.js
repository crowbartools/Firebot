// Migration: done

'use strict';

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "scrambleText",
        usage: "scrambleText[text]",
        description: "Scrambles the input text",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text) => {
        text = text.split('');

        let result = '';
        while (text.length) {
            let idx = Math.floor(Math.random() * text.length);
            result += text[idx];
            text.splice(idx, 1);
        }

        return result;
    }
};

module.exports = model;
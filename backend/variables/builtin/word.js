"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "word",
        description: "Get a word at the specified position in a given sentence",
        usage: "word[text, #]",
        examples: [
            {
                usage: 'word[This is a test, 4]',
                description: "Get the 4th word. In this example: 'test'"
            }
        ],
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, text, position) => {
        if (text == null) {
            return "[No text provided]";
        }

        const index = parseInt(position);
        if (isNaN(index)) {
            return "[Position not number]";
        }

        const word = text.split(" ")[index + 1];

        return word || "[No word at position]";
    }
};

module.exports = model;

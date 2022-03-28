"use strict";

// Dummy variable - $if logic gets handled by the evaluator

const { OutputDataType, VariableCategory } = require("../../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "if",
        usage: "if[condition, when_true, when_false]",
        description: 'Returns the parameter based on the condition\'s result.',
        examples: [
            {
                usage: 'if[$user === Jim, JIM]',
                description: "Returns JIM if the user is Jim, otherwise returns empty text"
            },
            {
                usage: 'if[$user === Jim, JIM, JOHN]',
                description: "Returns JIM if the user is Jim, otherwise returns JOHN"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    }
};
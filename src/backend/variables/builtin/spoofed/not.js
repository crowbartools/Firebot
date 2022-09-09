"use strict";

// Dummy variable - $NOT logic gets handled by the evaluator

const { OutputDataType, VariableCategory } = require("../../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "NOT",
        usage: "NOT[condition]",
        description: 'Returns the opposite of the condition\'s result. Only works within $if[]',
        examples: [
            {
                usage: 'NOT[1 === 1]',
                description: "Returns false as the condition is true"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL]
    }
};
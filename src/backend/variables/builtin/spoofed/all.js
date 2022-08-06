"use strict";

// Dummy variable - $ALL logic gets handled by the evaluator

const { OutputDataType, VariableCategory } = require("../../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "ALL",
        usage: "ALL[condition, condition, ...]",
        description: 'Returns true if all of the conditions are true. Only works within $if[]',
        examples: [
            {
                usage: 'ALL[a === a, b === b]',
                description: "Returns true as a equals a and b equals b"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL]
    }
};
"use strict";

// Dummy variable - $AND logic gets handled by the evaluator

const { OutputDataType, VariableCategory } = require("../../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "AND",
        usage: "AND[condition, condition, ...]",
        description: 'Returns true if all of the conditions are true. Only works within $if[]',
        examples: [
            {
                usage: 'AND[a === a, b === b]',
                description: "Returns true as a equals a and b equals b"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL]
    }
};
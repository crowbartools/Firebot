"use strict";

// Dummy variable - $OR logic gets handled by the evaluator

const { OutputDataType, VariableCategory } = require("../../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "OR",
        usage: "OR[condition, condition, ...]",
        description: 'Returns true if any of the conditions are true. Only works within $if[]',
        examples: [
            {
                usage: 'OR[a === b, c === c]',
                description: "Returns true as c equals c"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL]
    }
};
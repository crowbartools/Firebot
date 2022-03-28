"use strict";

// Dummy variable - $NALL logic gets handled by the evaluator

const { OutputDataType, VariableCategory } = require("../../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "NALL",
        usage: "NALL[condition, condition, ...]",
        description: 'Returns true if any of the conditions return false',
        examples: [
            {
                usage: 'NALL[a === a, b === c]',
                description: "Returns true as b does not equals c"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL]
    }
};
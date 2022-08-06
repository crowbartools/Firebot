"use strict";

// Dummy variable - $NOR logic gets handled by the evaluator

const { OutputDataType, VariableCategory } = require("../../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "NOR",
        usage: "NOR[condition, condition, ...]",
        description: 'Returns true if all of the conditions return false',
        examples: [
            {
                usage: 'NOR[a === b, b === c]',
                description: "Returns true as a does not equal be and b does not equals c"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL]
    }
};
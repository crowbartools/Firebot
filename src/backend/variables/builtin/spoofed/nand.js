"use strict";

// Dummy variable - $NAND logic gets handled by the evaluator

const { OutputDataType, VariableCategory } = require("../../../../shared/variable-constants");

module.exports = {
    definition: {
        handle: "NAND",
        usage: "NAND[condition, condition, ...]",
        description: 'Returns true if any of the conditions return false',
        examples: [
            {
                usage: 'NAND[a === a, b === c]',
                description: "Returns true as b does not equals c"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL]
    }
};
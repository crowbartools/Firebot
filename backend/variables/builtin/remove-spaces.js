"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "removeSpaces",
        description: "Remove all spaces in variable",
        usage: "removeSpaces[input]",
        possibleDataOutput: [OutputDataType.STRING]
    },
    evaluator: (_, input) => {
        const data = input.replace(/\s/g,'');

        // cast input as number, and if its finite return the recast input
        if (data != null && data.length > 0) {
            return (data);
        }

        // Defaults to 0
        return 0;
    }
};

module.exports = model;

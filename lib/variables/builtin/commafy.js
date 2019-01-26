"use strict";

/**
 * The $time24 variable
 */
const model = {
    definition: {
        handle: "commafy",
        description: "Adds the appropriate commas to a number.",
        usage: "commafy[number]"
    },
    evaluator: (_, number) => {
        if (isNaN(number)) {
            return "[Error: not a number]";
        }
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
};

module.exports = model;

"use strict";

const mathjs = require('mathjs');
const logger = require("../../logwrapper");

const model = {
    definition: {
        handle: "math",
        usage: "math[expression]",
        description: "Evaluate a math equation"
    },
    evaluator: (_, exp) => {
        let evalulation;
        try {
            evalulation = mathjs.eval(exp);
        } catch (err) {
            logger.warn("error parsing math expression", err);
            evalulation = "[MATH EVAL ERROR]";
        }
        if (typeof evalulation === "object") {
            if (evalulation.entries.length > 0) {
                evalulation = evalulation.entries[0];
            } else {
                evalulation = "[MATH EVAL ERROR]";
            }
        }
        return evalulation;
    },
    argsCheck: (exp) => {

        if (exp == null || exp.length < 1) {
            throw new SyntaxError("A math expression must be included!");
        }

        return true;
    }
};

module.exports = model;

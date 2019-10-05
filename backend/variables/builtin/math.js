"use strict";

const mathjs = require('mathjs');
const logger = require("../../logwrapper");
const { OutputDataType } = require("../../../shared/variable-contants");
const utils = require("../../utility");

const model = {
    definition: {
        handle: "math",
        usage: "math[expression]",
        description: "Evaluate a math equation",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger, exp) => {

        exp = await utils.populateStringWithTriggerData(exp, trigger);

        let evalulation;
        try {
            evalulation = mathjs.eval(exp);
        } catch (err) {
            logger.warn("error parsing math expression", err);
            evalulation = -1;
        }
        if (typeof evalulation === "object") {
            if (evalulation.entries.length > 0) {
                evalulation = evalulation.entries[0];
            } else {
                evalulation = -1;
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

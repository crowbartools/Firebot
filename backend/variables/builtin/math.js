// Migration: done

"use strict";

const mathjs = require('mathjs');
const logger = require("../../logwrapper");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const utils = require("../../utility");

const model = {
    definition: {
        handle: "math",
        usage: "math[expression]",
        description: "Evaluate a math equation",
        categories: [VariableCategory.COMMON, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger, exp) => {

        // TODO(ebiggz, v5.3.2): remove this after a few versions to give users time to not needing to quote arguments to get validation to work
        exp = await utils.populateStringWithTriggerData(exp, trigger);

        let evalulation;
        try {
            evalulation = mathjs.evaluate(exp);
        } catch (err) {
            logger.warn("error parsing math expression", err);
            evalulation = -1;
        }
        if (evalulation != null && typeof evalulation === "object") {
            if (evalulation.entries.length > 0) {
                evalulation = evalulation.entries[0];
            } else {
                evalulation = -1;
            }
        }
        return evalulation != null ? evalulation : -1;
    },
    argsCheck: (exp) => {

        if (exp == null || exp.length < 1) {
            throw new SyntaxError("A math expression must be included!");
        }

        return true;
    }
};

module.exports = model;

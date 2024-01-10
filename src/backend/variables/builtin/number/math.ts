import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const mathjs = require('mathjs');
const logger = require("../../../logwrapper");

const model : ReplaceVariable = {
    definition: {
        handle: "math",
        usage: "math[expression]",
        description: 'Evaluate a math equation using <a href="https://mathjs.org/docs/index.html">math.js</a>',
        categories: [VariableCategory.COMMON, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (_: unknown, subject: string) => {

        let evaluation;
        try {
            evaluation = mathjs.evaluate(subject);
        } catch (err) {
            logger.warn("error parsing math expression", err);
            evaluation = -1;
        }
        if (evaluation != null && typeof evaluation === "object") {
            if (evaluation.entries.length > 0) {
                evaluation = evaluation.entries[0];
            } else {
                evaluation = -1;
            }
        }
        return evaluation != null ? evaluation : -1;
    },
    argsCheck: (exp: string) => {
        if (exp == null || exp.length < 1) {
            throw new SyntaxError("A math expression must be included!");
        }

        return true;
    }
};

export default model;

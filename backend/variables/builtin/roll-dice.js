// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const { processDice } = require("../../common/handlers/diceProcessor");

const model = {
    definition: {
        handle: "rollDice",
        usage: "rollDice[diceConfig]",
        examples: [
            {
                usage: "rollDice[1d6]",
                description: "Roll one 6-sided dice, outputs the sum"
            },
            {
                usage: "rollDice[2d10+1d12]",
                description: "Roll two 10-sided dice and one 12-sided die, outputs the sum"
            },
            {
                usage: "rollDice[2d6, show each]",
                description: "Outputs text containing both the sum of all roles and the values or each individual roll. IE: '10 (4, 6)"
            }
        ],
        description: "Rolls some dice based on the provided config, ie 2d6 or 2d10+1d12 or 1d10+3",
        categories: [VariableCategory.COMMON, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (_, diceConfig, option) => {
        const showEach = option?.toLowerCase() === "show each";

        const output = processDice(diceConfig, showEach);

        if (output) {
            return 0;
        }

        return `${result} (${rolled.join(", ")})`;
    }
};

module.exports = model;

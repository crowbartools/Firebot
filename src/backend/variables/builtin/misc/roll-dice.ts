import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const { processDice } = require("../../../common/handlers/diceProcessor");

const model : ReplaceVariable = {
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
    evaluator: (_, diceConfig, option: string) => {
        const showEach = option?.toLowerCase() === "show each";
        const output = processDice(diceConfig, showEach);
        return (output == null || output === '') ? 0 : output;
    }
};

export default model;
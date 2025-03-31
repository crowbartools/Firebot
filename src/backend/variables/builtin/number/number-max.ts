import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const normalizeNumber = (input) => {
    const value = Number(input);
    return Number.isInteger(value) ? value : null;
};

const model : ReplaceVariable = {
    definition: {
        handle: "max",
        description: "Returns the highest-value number",
        usage: "max[num1, num2, ...]",
        examples: [
            {
                usage: "max[1, 5, 3, 10]",
                description: "Returns 10, the highest value from the input numbers"
            },
            {
                usage: "max[numberArray]",
                description: "Returns the highest value from the input array of numbers"
            },
            {
                usage: "max[``[1, 5, 3, 10]``]",
                description: "Returns 10, the highest value from the input stringified array of numbers"
            },
            {
                usage: "max[``[8, 12]``, 5, 3, 10]",
                description: "Returns 12, the highest value from the input stringified array and numbers"
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (
        trigger: Trigger,
        ...args: Array<string | number | Array<string | number>>
    ) : number => {
        const numArgs : number[] = args.flatMap((value) => {
            if (Array.isArray(value)) {
                return value.map(normalizeNumber);
            }
            if (typeof value === "string") {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        return parsed.map(normalizeNumber);
                    }
                } catch (e) {
                    return normalizeNumber(value);
                }
            }
            return normalizeNumber(value);
        }).filter(value => value !== null);

        const max = Math.max(...numArgs);
        return Number.isNaN(max) ? 0 : max;
    }
};

export default model;
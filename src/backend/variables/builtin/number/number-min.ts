import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const normalizeNumber = (input) => {
    const value = Number(input);
    return Number.isFinite(value) ? value : null;
};

const model : ReplaceVariable = {
    definition: {
        handle: "min",
        description: "Returns the lowest-value number",
        usage: "min[num1, num2, ...]",
        examples: [
            {
                usage: "min[1, 5, 3, 10]",
                description: "Returns 1, the lowest value from the input numbers"
            },
            {
                usage: "min[numberArray]",
                description: "Returns the lowest value from the input array of numbers"
            },
            {
                usage: "min[``[1, 5, 3, 10]``]",
                description: "Returns 1, the lowest value from the input stringified array of numbers"
            },
            {
                usage: "min[``[8, 12]``, 5, 3, 10]",
                description: "Returns 3, the lowest value from the input stringified array and numbers"
            }
        ],
        categories: ["numbers"],
        possibleDataOutput: ["null", "number"]
    },
    evaluator: (
        trigger: Trigger,
        ...args: Array<string | number>
    ) : number => {
        const numArgs : number[] = args.flatMap((value) => {
            if (Array.isArray(value)) {
                return value.map(normalizeNumber);
            }
            if (typeof value === "string") {
                try {
                    const parsed = JSON.parse(value) as object;
                    if (Array.isArray(parsed)) {
                        return parsed.map(normalizeNumber);
                    }
                } catch {
                    return normalizeNumber(value);
                }
            }
            return normalizeNumber(value);
        }).filter(value => value !== null);

        const max = Math.min(...numArgs);
        return Number.isNaN(max) ? 0 : max;
    }
};

export default model;
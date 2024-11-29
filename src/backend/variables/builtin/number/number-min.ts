import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "min",
        description: "Returns the lowest-value number",
        usage: "min[num1, num2, ...]",
        examples: [
            {
                usage: "min[1, 5, 3, 10]",
                description: "Returns 1, the lowest value from the input numbers"
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NULL, OutputDataType.NUMBER]
    },
    evaluator: (
        trigger: Trigger,
        ...args: Array<string | number>
    ) : number => {
        const numArgs : number[] = args.map((value) => {
            value = Number(value);
            if (Number.isInteger(value)) {
                return value;
            }
            return null;
        }).filter(value => value !== null);

        const max = Math.min(...numArgs);
        return Number.isNaN(max) ? 0 : max;
    }
};

export default model;
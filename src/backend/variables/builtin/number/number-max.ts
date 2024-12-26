import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "max",
        description: "Returns the highest-value number",
        usage: "max[num1, num2, ...]",
        examples: [
            {
                usage: "max[1, 5, 3, 10]",
                description: "Returns 10, the highest value from the input numbers"
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
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

        const max = Math.max(...numArgs);
        return Number.isNaN(max) ? 0 : max;
    }
};

export default model;
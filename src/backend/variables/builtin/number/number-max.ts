import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "max",
        description: "Returns the highest-value numbered passed",
        usage: "max[num1, num2, ...]",
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
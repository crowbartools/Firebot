import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "floor",
        description: "Rounds down the given number to the nearest whole number.",
        usage: "floor[num]",
        examples: [
            {
                usage: "floor[3.7]",
                description: "Returns 3"
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (
        trigger: Trigger,
        subject: number | string
    ) : number => {
        subject = Number(subject);
        if (!Number.isFinite(subject)) {
            return 0;
        }

        return Math.floor(subject);
    }
};

export default model;
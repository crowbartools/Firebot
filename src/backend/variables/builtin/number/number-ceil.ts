import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "ceil",
        description: "Rounds up the given number to the nearest whole number.",
        usage: "ceil[num]",
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
        return Math.ceil(subject);
    }
};

export default model;

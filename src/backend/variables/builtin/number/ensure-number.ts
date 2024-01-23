import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "ensureNumber",
        description: "Guarantees a number output. If the input is a number, it's passed through. If it's not, the given default number is used instead.",
        usage: "ensureNumber[input, defaultNumber]",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (
        trigger: Trigger,
        input: unknown,
        defaultNumber: unknown
    ) : number => {
        if (input != null && Number.isFinite(Number(input))) {
            return Number(input);
        }

        return Number.isFinite(Number(defaultNumber)) ? Number(defaultNumber) : 0;
    }
};

export default model;

import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayFrom",
        usage: "arrayFrom[value, value, ...]",
        description: "Returns a raw array containing the listed values",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger: Trigger, ...values: unknown[]) : unknown[] => values
};

export default model;
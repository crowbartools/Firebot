import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arraySlice",
        description: "Returns a slice of an array",
        usage: "arraySlice[array, start, end]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: string | unknown[],
        start?: string,
        end?: string
    ) : unknown[] => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (ignore) {
                return [];
            }
        }
        if (!Array.isArray(subject)) {
            return [];
        }
        return [...subject].slice(
            start ? Number(start) : 0,
            end ? Number(end) : subject.length
        );
    }
};

export default model;
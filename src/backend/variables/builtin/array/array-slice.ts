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
        start?: string | number,
        end?: string | number
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

        start = start ? Number(start) : 0;
        if (Number.isNaN(start)) {
            start = 0;
        }

        end = end ? Number(end) : subject.length;
        if (Number.isNaN(end)) {
            end = subject.length;
        }

        return [...subject].slice(start, end);
    }
};

export default model;
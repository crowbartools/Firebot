import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayReverse",
        description: "Returns a new reversed array",
        usage: "arrayReverse[array]",
        examples: [
            {
                usage: `arrayReverse["[1,2,3]"]`,
                description: "Returns [3,2,1]."
            },
            {
                usage: "arrayReverse[rawArray]",
                description: "Returns the reversed raw array."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: string | unknown[]
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
        return [...subject].reverse();
    }
};

export default model;
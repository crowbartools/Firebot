import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayLength",
        usage: "arrayLength[array]",
        description: "Returns the length of the input array.",
        examples: [
            {
                usage: `arrayLength["[1,2,3]"]`,
                description: "Returns 3."
            },
            {
                usage: "arrayLength[rawArray]",
                description: "Returns the length of the raw array."
            }
        ],
        categories: [VariableCategory.ADVANCED, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (
        trigger: Trigger,
        subject: string | unknown
    ) : number => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (ignore) {
                return 0;
            }
        }

        if (Array.isArray(subject)) {
            return subject.length;
        }
        return 0;
    }
};

export default model;
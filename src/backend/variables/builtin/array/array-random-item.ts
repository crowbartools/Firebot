import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayRandomItem",
        usage: "arrayRandomItem[array]",
        description: "Returns a random item from the given array",
        examples: [
            {
                usage: `arrayRandomItem["[1,2,3]"]`,
                description: "Returns a random item from the array [1,2,3]."
            },
            {
                usage: "arrayRandomItem[rawArray]",
                description: "Returns a random item from the raw array."
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
                return null;
            }
        }

        if (Array.isArray(subject) && subject.length) {
            return subject[Math.floor(Math.random() * subject.length)];
        }
        return null;
    }
};

export default model;
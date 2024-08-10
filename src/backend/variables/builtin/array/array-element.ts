import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayElement",
        usage: "arrayElement[array, index]",
        description: "Returns the element at the given index of the input array.",
        examples: [
            {
                usage: 'arrayElement["[1,2,3]", 0]',
                description: "Returns the element at the 0 index (1)"
            },
            {
                usage: 'arrayElement["[1,2,3]", first]',
                description: "Returns the element at the first index (1)"
            },
            {
                usage: 'arrayElement["[1,2,3]", last]',
                description: 'Returns the element at the last index (3)'
            },
            {
                usage: 'arrayElement[rawArray, 0]',
                description: "Returns the element at the 0 index"
            },
            {
                usage: 'arrayElement[rawArray, first]',
                description: 'Returns the element at the first index'
            },
            {
                usage: 'arrayElement[rawArray, last]',
                description: 'Returns the element at the last index'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },

    evaluator: (
        trigger: Trigger,
        subject: string | Array<unknown>,
        index: number | string
    ) : unknown => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch {
                return null;
            }
        }

        if (!Array.isArray(subject) || subject.length === 0) {
            return null;
        }
        if (`${index}`.toLowerCase() === 'first') {
            return subject[0];
        }
        if (`${index}`.toLowerCase() === 'last') {
            return subject[subject.length - 1];
        }

        return subject[index];
    }
};

export default model;

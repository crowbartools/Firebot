import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayRemove",
        description: "Returns a new array with the element at the given index removed",
        usage: "arrayRemove[array, index]",
        examples: [
            {
                usage: 'arrayRemove["[1,2,3]", 0]',
                description: "Removes the element at the 0 index (2,3)"
            },
            {
                usage: 'arrayRemove["[1,2,3]", last]',
                description: 'Removes the element at the last index (1,2)'
            },
            {
                usage: 'arrayRemove[rawArray, 0]',
                description: "Removes the element at the 0 index"
            },
            {
                usage: 'arrayRemove[rawArray, last]',
                description: 'Removes the element at the last index'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: string | unknown[],
        index: number | string = 0
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
        if (`${index}`.toLowerCase() === 'last') {
            return subject.slice(0, subject.length - 1);
        }
        index = Number(index);
        if (Number.isNaN(index)) {
            return [...subject];
        }
        subject = [...subject];
        subject.splice(index, 1);
        return subject;
    }
};

export default model;
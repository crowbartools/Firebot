import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: 'arrayAdd',
        description: 'Returns a new array with the added element',
        usage: 'arrayAdd[array, new-item, at-start]',
        examples: [
            {
                usage: 'arrayAdd["[1,2,3]", 4]',
                description: 'Returns a new array with 4 added to the end of the array. (1,2,3,4)'
            },
            {
                usage: 'arrayAdd["[1,2,3]", 4, true]',
                description: 'Returns a new array with 4 added to the start of the array. (4,1,2,3)'
            },
            {
                usage: 'arrayAdd[rawArray, 4]',
                description: 'Returns a new array with 4 added to the end of the raw array'
            },
            {
                usage: 'arrayAdd[rawArray, 4, true]',
                description: 'Returns a new array with 4 added to the start of the raw array'
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },

    evaluator: (
        trigger: Trigger,
        subject: string | Array<unknown>,
        item: unknown,
        prepend: boolean | string = false
    ) : Array<unknown> => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);


            } catch (ignore) {}
        }
        if (!Array.isArray(subject)) {
            return [item];
        }

        if (prepend === true || prepend === "true") {
            return [item, ...subject];
        }

        return [...subject, item];
    }
};

export default model;
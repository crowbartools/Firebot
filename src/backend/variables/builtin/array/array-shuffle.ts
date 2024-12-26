import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const shuffle = (subject: unknown[]) : unknown[] => {
    const arrayCopy = subject.slice(0);

    for (let i = arrayCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }

    return arrayCopy;
};

const model : ReplaceVariable = {
    definition: {
        handle: "arrayShuffle",
        description: "Returns a new shuffled array",
        usage: "arrayShuffle[array]",
        examples: [
            {
                usage: `arrayShuffle["[1,2,3]"]`,
                description: "Returns a shuffled version of [1,2,3], e.g., [2,1,3]."
            },
            {
                usage: "arrayShuffle[rawArray]",
                description: "Returns a shuffled version of the raw array."
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

        return shuffle(subject);
    }
};

export default model;
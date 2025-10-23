import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayJoin",
        description: "Returns a string with each array item joined together with the given separator",
        usage: "arrayJoin[array, separator]",
        examples: [
            {
                usage: `arrayJoin["[1,2,3]", ", "]`,
                description: `Returns "1, 2, 3".`
            },
            {
                usage: `arrayJoin["["apple","banana","cherry"]", " - "]`,
                description: `Returns "apple - banana - cherry".`
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },

    evaluator: (
        trigger: Trigger,
        subject: string | unknown[],

        separator : string = ","
    ) : string => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (ignore) {
                return '';
            }
        }
        if (Array.isArray(subject)) {
            return subject.join(separator);
        }
        return "";
    }
};

export default model;
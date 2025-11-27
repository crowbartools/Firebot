import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "capitalize",
        description: "Capitalizes the first letter of the given text, converting the rest into lowercase",
        usage: "capitalize[text]",
        examples: [
            {
                usage: `capitalize["hello world"]`,
                description: `Returns "Hello world".`
            },
            {
                usage: `capitalize["HELLO WORLD"]`,
                description: `Returns "Hello world".`
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown
    ) : string => {
        if (typeof subject === 'string' || subject instanceof String) {
            const text = `${subject}`;

            if (text.length === 1) {
                return text.toUpperCase();
            }
            if (text.length > 1) {
                return `${text[0].toUpperCase()}${text.slice(1).toLowerCase()}`;
            }
        }
        return '';
    }
};

export default model;
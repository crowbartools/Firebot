import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "textLength",
        usage: "textLength[text]",
        description: "Returns the length of the input text",
        categories: ["text"],
        possibleDataOutput: ["number"]
    },
    evaluator: (
        trigger: Trigger,
        text: unknown
    ) : number => {
        if (
            text === true ||
            text === false ||
            Number.isFinite(text) ||
            typeof text === 'string' ||
            text instanceof String
        ) {
            return `${text}`.length;
        }
        return 0;
    }
};

export default model;